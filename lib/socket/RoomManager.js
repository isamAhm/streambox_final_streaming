// In-memory room state
// Map<roomId, InMemoryRoom>
const rooms = new Map();

// Disconnected session TTL store: Map<userId+roomId, { roomId, playbackState, disconnectedAt }>
const disconnectedSessions = new Map();
const SESSION_TTL_MS = 30 * 1000;

function getSessionKey(userId, roomId) {
  return `${userId}:${roomId}`;
}

function currentPosition(playbackState) {
  if (!playbackState.isPlaying || !playbackState.startedAt) {
    return playbackState.startTimestamp;
  }
  return playbackState.startTimestamp + (Date.now() - playbackState.startedAt) / 1000;
}

function promoteHost(room) {
  const remaining = [...room.participants.values()].sort(
    (a, b) => a.joinedAt - b.joinedAt
  );
  if (remaining.length === 0) return null;
  const newHost = remaining[0];
  newHost.isHost = true;
  room.hostUserId = newHost.userId;
  room.hostSocketId = newHost.socketId;
  return newHost;
}

function registerRoomHandlers(io, socket) {
  socket.on('join-room', ({ roomId, userId, displayName, avatarUrl, hostUserId: clientHostUserId }) => {
    if (!roomId || !userId) return;

    // Check for reconnect within TTL
    const sessionKey = getSessionKey(userId, roomId);
    const saved = disconnectedSessions.get(sessionKey);
    if (saved) {
      clearTimeout(saved.timer);
      disconnectedSessions.delete(sessionKey);
    }

    // Determine the authoritative host: use clientHostUserId if provided, else first joiner
    const resolvedHostUserId = clientHostUserId || userId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        hostUserId: resolvedHostUserId,
        hostSocketId: resolvedHostUserId === userId ? socket.id : null,
        participants: new Map(),
        playbackState: { contentId: null, startTimestamp: 0, startedAt: null, isPlaying: false },
        currentMovie: null,
        bufferingParticipants: new Set(),
      });
    } else {
      const existingRoom = rooms.get(roomId);
      if (existingRoom.participants.size === 0) {
        // Room is empty (e.g. after strict mode eviction) — restore authoritative host
        existingRoom.hostUserId = resolvedHostUserId;
        existingRoom.hostSocketId = resolvedHostUserId === userId ? socket.id : null;
      } else if (clientHostUserId && !existingRoom.hostUserId) {
        // Room exists but has no host set — use the authoritative one from DB
        existingRoom.hostUserId = clientHostUserId;
      }
    }

    const room = rooms.get(roomId);

    // If this user IS the host, always update hostSocketId to their current socket
    if (room.hostUserId === userId) {
      room.hostSocketId = socket.id;
    }

    // Evict any existing socket entry for this userId (handles reconnects + strict mode double-mount)
    for (const [existingSocketId, p] of room.participants.entries()) {
      if (p.userId === userId && existingSocketId !== socket.id) {
        room.participants.delete(existingSocketId);
        room.bufferingParticipants.delete(existingSocketId);
        break;
      }
    }

    // Host is whoever matches the room's authoritative hostUserId
    const isHost = room.hostUserId === userId;

    const participant = {
      socketId: socket.id,
      userId,
      displayName,
      avatarUrl: avatarUrl || null,
      joinedAt: Date.now(),
      isHost,
    };

    room.participants.set(socket.id, participant);
    socket.join(roomId);

    // Send current state to joining participant
    socket.emit('room-state', {
      participants: [...room.participants.values()],
      playbackState: room.playbackState,
      movie: room.currentMovie || null,
    });

    // Broadcast join to others (not self)
    socket.to(roomId).emit('participant-joined', {
      socketId: socket.id,
      userId,
      displayName,
      avatarUrl: avatarUrl || null,
      isHost,
    });
  });

  socket.on('leave-room', ({ roomId }) => {
    handleLeave(io, socket, roomId);
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        handleLeave(io, socket, roomId);
      }
    }
  });

  socket.on('play', ({ roomId, timestamp }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (!participant || room.hostUserId !== participant.userId) {
      socket.emit('error', { code: 403, message: 'Host only' });
      return;
    }
    const startedAt = Date.now();
    room.playbackState = { ...room.playbackState, startTimestamp: timestamp, startedAt, isPlaying: true };
    io.to(roomId).emit('play', { timestamp, startedAt });
  });

  socket.on('pause', ({ roomId, timestamp }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (!participant || room.hostUserId !== participant.userId) {
      socket.emit('error', { code: 403, message: 'Host only' });
      return;
    }
    room.playbackState = { ...room.playbackState, startTimestamp: timestamp, startedAt: null, isPlaying: false };
    io.to(roomId).emit('pause', { timestamp });
  });

  socket.on('content-change', ({ roomId, contentId, movie }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (!participant || room.hostUserId !== participant.userId) {
      socket.emit('error', { code: 403, message: 'Host only' });
      return;
    }
    room.playbackState = { contentId, startTimestamp: 0, startedAt: null, isPlaying: false };
    room.currentMovie = movie || null;
    room.bufferingParticipants.clear();
    io.to(roomId).emit('content-change', { contentId, movie: room.currentMovie });
  });

  socket.on('buffer-start', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (!participant) return;

    room.bufferingParticipants.add(socket.id);
    const pos = currentPosition(room.playbackState);
    room.playbackState = { ...room.playbackState, startTimestamp: pos, startedAt: null, isPlaying: false };

    io.to(roomId).emit('pause', { timestamp: pos });
    io.to(roomId).emit('latency-indicator', { userId: participant.userId, displayName: participant.displayName });
  });

  socket.on('buffer-resolved', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (!participant) return;

    room.bufferingParticipants.delete(socket.id);
    io.to(roomId).emit('dismiss-latency-indicator', { userId: participant.userId });

    if (room.bufferingParticipants.size === 0 && room.playbackState.contentId) {
      const startedAt = Date.now();
      room.playbackState = { ...room.playbackState, startedAt, isPlaying: true };
      io.to(roomId).emit('play', { timestamp: room.playbackState.startTimestamp, startedAt });
    }
  });
}

function handleLeave(io, socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const participant = room.participants.get(socket.id);
  if (!participant) return;

  room.participants.delete(socket.id);
  room.bufferingParticipants.delete(socket.id);
  socket.leave(roomId);

  // Store session for potential reconnect
  const sessionKey = getSessionKey(participant.userId, roomId);
  const timer = setTimeout(() => disconnectedSessions.delete(sessionKey), SESSION_TTL_MS);
  disconnectedSessions.set(sessionKey, { roomId, playbackState: room.playbackState, disconnectedAt: Date.now(), timer });

  if (room.participants.size === 0) {
    // Delay room deletion to allow for React strict mode rapid reconnect
    setTimeout(() => {
      const r = rooms.get(roomId);
      if (r && r.participants.size === 0) {
        rooms.delete(roomId);
      }
    }, 2000);
    return;
  }

  io.to(roomId).emit('participant-left', {
    socketId: socket.id,
    userId: participant.userId,
    displayName: participant.displayName,
  });

  // Promote new host if needed
  if (participant.isHost) {
    const newHost = promoteHost(room);
    if (newHost) {
      io.to(roomId).emit('host-change', {
        newHostSocketId: newHost.socketId,
        newHostUserId: newHost.userId,
        displayName: newHost.displayName,
      });
    }
  }
}

module.exports = { registerRoomHandlers };
