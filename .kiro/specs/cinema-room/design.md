# Design Document: Cinema Room

## Overview

Cinema Room is a synchronized watch-party feature for StreamBox. A host creates a room, shares a link, and controls playback while all participants independently stream the same content via the existing iframe-based player (VidKing/VidSrc). Voice and video communication between participants is handled via WebRTC, with signaling relayed over the same Socket.io connection used for playback sync.

The central design challenge is that the existing streaming system uses third-party iframe embeds with cross-origin restrictions — we cannot call `.play()`, `.pause()`, or `.currentTime` on the underlying video element. Sync is therefore achieved through a **coordinated start-time** approach: the server maintains a room clock (`startedAt` UTC + `startTimestamp` offset), and each participant reloads the iframe with the computed current position when they join or when a seek occurs.

### Key Design Decisions

1. **Socket.io over a Next.js custom server** (`server.js`) — Next.js API routes do not support persistent WebSocket upgrades in production. A custom Node.js HTTP server wrapping the Next.js app is the standard pattern for Socket.io + Next.js.

2. **Coordinated start-time sync** — Because iframes are cross-origin, we cannot imperatively control playback. Instead, every play/seek event stores `{ startTimestamp, startedAt }` in the room state. Participants compute `currentPosition = startTimestamp + (Date.now() - startedAt) / 1000` and reload the iframe at that offset where the embed URL supports a `t=` or `start=` parameter.

3. **Buffer handling via acknowledgment flow** — Since we cannot detect buffering from the iframe, participants emit `buffer-start` manually (or via a UI "I'm buffering" mechanism) and `buffer-resolved` when ready. The server pauses all players on `buffer-start` and resumes on `buffer-resolved`.

4. **Full-mesh WebRTC** — For small rooms (≤8 participants), a full-mesh peer-to-peer topology is practical and avoids the complexity of an SFU. Signaling (offer/answer/ICE) is relayed through Socket.io.

5. **Host promotion by join order** — On host disconnect, the server promotes the participant with the earliest `joinedAt` timestamp among remaining connected participants.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Participant)                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  VideoPanel  │  │  ParticipantGrid  │  │  RoomControls    │  │
│  │  (iframe)    │  │  (WebRTC tiles)   │  │  (host controls) │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
│         │                   │                      │             │
│         └───────────────────┴──────────────────────┘            │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  useCinemaRoom  │  (React context/hook)    │
│                    │  Socket.io client│                          │
│                    └────────┬────────┘                          │
└─────────────────────────────┼───────────────────────────────────┘
                              │  Socket.io (WSS)
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                     Custom Next.js Server (server.js)            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Socket.io Server                       │   │
│  │                                                           │   │
│  │  RoomManager          SyncRelay           SignalingRelay  │   │
│  │  - room lifecycle     - broadcast events  - WebRTC SDP   │   │
│  │  - host promotion     - buffer handling   - ICE exchange  │   │
│  │  - reconnect restore  - room clock        │               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Next.js App (HTTP)                     │   │
│  │  pages/api/cinema-room/  (REST: create, join, state)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │  Prisma / MongoDB
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                          MongoDB Atlas                           │
│  CinemaRoom  ·  CinemaRoomParticipant  ·  (existing models)     │
└─────────────────────────────────────────────────────────────────┘
```

### WebRTC Full-Mesh Topology

```
Participant A ◄──────────────► Participant B
      ▲                               ▲
      │                               │
      └──────────► Participant C ◄────┘

Each pair maintains a direct RTCPeerConnection.
Signaling (offer/answer/ICE) is relayed via Socket.io.
```

---

## Components and Interfaces

### Server-Side

#### `server.js` — Custom Next.js + Socket.io Server

Wraps the Next.js request handler and attaches a Socket.io server to the same HTTP server instance. Handles all real-time logic.

```
Responsibilities:
- Attach Socket.io to the HTTP server
- Import and register the RoomManager event handlers
- Forward all other requests to Next.js
```

#### `lib/socket/RoomManager.ts`

In-memory room state (supplemented by DB for persistence/reconnect).

```typescript
interface InMemoryRoom {
  roomId: string;
  hostSocketId: string;
  participants: Map<string, InMemoryParticipant>; // socketId → participant
  playbackState: PlaybackState;
  bufferingParticipants: Set<string>; // socketIds currently buffering
}

interface InMemoryParticipant {
  socketId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: Date;
  isHost: boolean;
}

interface PlaybackState {
  contentId: string | null;
  startTimestamp: number;   // seconds into video at last play/seek
  startedAt: number | null; // UTC ms when play was issued (null = paused)
  isPlaying: boolean;
}
```

Key methods:
- `handleJoin(socket, roomId, userId)` — add participant, send current state, broadcast join
- `handleLeave(socket, roomId)` — remove participant, promote host if needed, broadcast leave
- `handlePlay(socket, roomId, timestamp)` — validate host, update state, broadcast
- `handlePause(socket, roomId, timestamp)` — validate host, update state, broadcast
- `handleContentChange(socket, roomId, contentId)` — validate host, reset state, broadcast
- `handleBufferStart(socket, roomId)` — add to buffering set, broadcast pause + latency indicator
- `handleBufferResolved(socket, roomId)` — remove from buffering set, if set empty → broadcast play
- `handleReconnect(socket, roomId, userId)` — restore session if within 30s window
- `promoteHost(roomId)` — find earliest `joinedAt`, update DB + in-memory, broadcast host-change

#### `lib/socket/SignalingRelay.ts`

Thin relay — forwards WebRTC signaling messages between specific socket pairs.

```
handleOffer(socket, { targetSocketId, sdp })  → emit to target
handleAnswer(socket, { targetSocketId, sdp }) → emit to target
handleIceCandidate(socket, { targetSocketId, candidate }) → emit to target
```

### REST API Routes (`pages/api/cinema-room/`)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/cinema-room/create` | POST | required | Create room, return roomId + link |
| `/api/cinema-room/[roomId]` | GET | required | Fetch room state (for SSR/join) |
| `/api/cinema-room/[roomId]/join` | POST | required | Record participant join in DB |

### Frontend Pages

#### `pages/cinema-room/index.tsx` — Lobby

- "Create Room" button → POST `/api/cinema-room/create` → redirect to `/cinema-room/[roomId]`
- "Join Room" input → navigate to `/cinema-room/[roomId]`

#### `pages/cinema-room/[roomId].tsx` — Room Page

- Fetches initial room state via REST on load
- Initialises Socket.io connection and WebRTC
- Renders `VideoPanel`, `ParticipantGrid`, `RoomControls`, `ContentPicker` (host only)

### Frontend Components

#### `components/CinemaRoom/VideoPanel.tsx`

- Renders the iframe embed using the same `streamingService` as `pages/watch/[movieId].tsx`
- Accepts `contentId`, `syncTimestamp`, `isPlaying` props
- On `isPlaying` change or `syncTimestamp` change: reloads iframe with computed `t=` offset
- Displays buffering overlay and latency indicator banner

**Iframe reload strategy:**
```
currentOffset = playbackState.startTimestamp + (Date.now() - playbackState.startedAt) / 1000
iframeUrl = streamingService.getMovieStreamSources(imdbId, tmdbId)[0].url + `&t=${Math.floor(currentOffset)}`
```
Note: VidKing and VidSrc.xyz support `?t=` / `#t=` for start time. When paused, the iframe is replaced with a poster/overlay showing the paused timestamp.

#### `components/CinemaRoom/ParticipantGrid.tsx`

- Renders a tile per participant
- Each tile: remote `<video>` element fed by WebRTC `MediaStream`, or avatar fallback when camera off
- Mute/camera-off indicators overlaid on tiles
- Crown icon on host tile

#### `components/CinemaRoom/RoomControls.tsx`

- Host: Play, Pause, "I'm buffering" toggle
- All participants: Mute toggle, Camera toggle, Leave room button
- Non-host controls are disabled/hidden for playback actions
- Seek slider rendered as a disabled, grayed-out control with `cursor-not-allowed` and a "Seek sync coming soon" tooltip — visible to all but non-interactive (third-party iframe players do not support reliable mid-video seeking via URL parameters)

#### `components/CinemaRoom/ContentPicker.tsx`

- Host-only modal
- Search/browse movies (reuses existing movie search API)
- On select → emits `content-change` via Socket.io

### Frontend Hooks

#### `hooks/useCinemaRoom.ts`

Central hook managing:
- Socket.io connection lifecycle
- Room state (participants, playbackState, bufferingUsers)
- WebRTC peer connections map (`Map<socketId, RTCPeerConnection>`)
- Local media stream (`getUserMedia`)
- Exposes: `roomState`, `localStream`, `remoteStreams`, `emit helpers`

---

## Data Models

### Prisma Schema Additions

```prisma
model CinemaRoom {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  roomId       String   @unique  // short nanoid, e.g. "xK9mP2"
  hostUserId   String
  contentId    String?  @db.ObjectId  // references Movie.id
  playbackState Json    // { startTimestamp: number, startedAt: number|null, isPlaying: boolean }
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  participants CinemaRoomParticipant[]

  @@index([roomId])
  @@index([isActive])
}

model CinemaRoomParticipant {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  roomId    String   // references CinemaRoom.roomId (not ObjectId)
  userId    String
  joinedAt  DateTime @default(now())
  isHost    Boolean  @default(false)

  @@unique([roomId, userId])
  @@index([roomId, joinedAt])
}
```

### PlaybackState JSON Shape

```typescript
interface PlaybackState {
  contentId: string | null;
  startTimestamp: number;    // seconds into video at last play/seek event
  startedAt: number | null;  // Date.now() ms when play was issued; null when paused
  isPlaying: boolean;
}
```

---

## Socket.io Event Protocol

### Client → Server Events

| Event | Payload | Auth check |
|---|---|---|
| `join-room` | `{ roomId, userId, displayName, avatarUrl }` | socket must be authenticated |
| `leave-room` | `{ roomId }` | — |
| `play` | `{ roomId, timestamp }` | must be host |
| `pause` | `{ roomId, timestamp }` | must be host |
| `content-change` | `{ roomId, contentId }` | must be host |
| `buffer-start` | `{ roomId }` | must be participant |
| `buffer-resolved` | `{ roomId }` | must be participant |
| `webrtc-offer` | `{ roomId, targetSocketId, sdp }` | — |
| `webrtc-answer` | `{ roomId, targetSocketId, sdp }` | — |
| `webrtc-ice-candidate` | `{ roomId, targetSocketId, candidate }` | — |

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `room-state` | `{ participants, playbackState }` | Sent to joining participant |
| `participant-joined` | `{ socketId, userId, displayName, avatarUrl, isHost }` | Broadcast on join |
| `participant-left` | `{ socketId, userId, displayName }` | Broadcast on leave/disconnect |
| `play` | `{ timestamp, startedAt }` | Broadcast play command |
| `pause` | `{ timestamp }` | Broadcast pause command |
| `content-change` | `{ contentId }` | Broadcast new content |
| `latency-indicator` | `{ userId, displayName }` | Show buffering banner |
| `dismiss-latency-indicator` | `{ userId }` | Hide buffering banner |
| `host-change` | `{ newHostSocketId, newHostUserId, displayName }` | Broadcast host promotion |
| `error` | `{ code, message }` | Error feedback (403, 404, etc.) |
| `webrtc-offer` | `{ fromSocketId, sdp }` | Forwarded offer |
| `webrtc-answer` | `{ fromSocketId, sdp }` | Forwarded answer |
| `webrtc-ice-candidate` | `{ fromSocketId, candidate }` | Forwarded ICE candidate |

---

## WebRTC Signaling Flow

Full-mesh: when participant C joins a room where A and B already exist, C initiates offers to both A and B.

```
C joins room
    │
    ├─ Server sends room-state to C (includes socketIds of A and B)
    │
    ├─ C calls getUserMedia → gets localStream
    │
    ├─ C creates RTCPeerConnection(A)
    │   ├─ C adds localStream tracks
    │   ├─ C creates offer → setLocalDescription
    │   └─ C emits webrtc-offer { targetSocketId: A.socketId, sdp }
    │           │
    │           └─ Server relays to A
    │                   │
    │                   ├─ A creates RTCPeerConnection(C)
    │                   ├─ A setRemoteDescription(offer)
    │                   ├─ A adds localStream tracks
    │                   ├─ A creates answer → setLocalDescription
    │                   └─ A emits webrtc-answer { targetSocketId: C.socketId, sdp }
    │                           │
    │                           └─ Server relays to C
    │                                   │
    │                                   └─ C setRemoteDescription(answer)
    │
    └─ (same flow for C ↔ B)

ICE candidates are exchanged via webrtc-ice-candidate events
throughout the above flow (trickle ICE).
```

**getUserMedia constraints (Requirement 6.9):**
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});
```

---

## Sync Mechanism for Iframe-Based Players

### Room Clock

The room clock is a virtual timeline maintained by the server:

```
PlaybackState = {
  startTimestamp: T,   // seconds into video when play was last issued
  startedAt: S,        // UTC ms when play was issued
  isPlaying: true
}

currentPosition(now) = T + (now - S) / 1000
```

When paused: `startedAt = null`, `isPlaying = false`, `startTimestamp` = position at pause.

### Participant Join Sync

```
1. Participant receives room-state with PlaybackState
2. If isPlaying:
     offset = startTimestamp + (Date.now() - startedAt) / 1000
   Else:
     offset = startTimestamp
3. VideoPanel loads iframe URL with &t=Math.floor(offset)
4. Participant emits buffer-start immediately
5. When iframe fires load event (or after 3s timeout), participant emits buffer-resolved
```

### Play Event

```
Host clicks Play at position P seconds
→ emits play { roomId, timestamp: P }
→ Server stores { startTimestamp: P, startedAt: Date.now(), isPlaying: true }
→ Server broadcasts play { timestamp: P, startedAt }
→ Each participant reloads iframe with &t=P (network latency is negligible vs video position)
```

### Seek (Coming Soon)

Seek is not implemented in the current version. Third-party iframe embed players (VidKing, VidSrc) do not reliably support mid-video seeking via URL parameters (`?t=`). The seek slider is rendered as a disabled "Coming Soon" control in the UI. This will be revisited if a streaming source with reliable seek support becomes available.

### Buffer Handling

```
Participant X starts buffering
→ emits buffer-start { roomId }
→ Server adds X to bufferingParticipants set
→ Server broadcasts pause { timestamp: currentPosition } to all
→ Server broadcasts latency-indicator { userId: X, displayName: X.name }

Participant X finishes buffering
→ emits buffer-resolved { roomId }
→ Server removes X from bufferingParticipants
→ If bufferingParticipants is now empty:
    Server broadcasts play { timestamp: pausedAt, startedAt: Date.now() }
    Server broadcasts dismiss-latency-indicator { userId: X }
```

### Host Promotion Algorithm

```
On host disconnect from roomId:
  remaining = participants in room sorted by joinedAt ASC
  if remaining is empty:
    mark room inactive in DB
    return
  newHost = remaining[0]
  update in-memory: newHost.isHost = true, room.hostSocketId = newHost.socketId
  update DB: CinemaRoomParticipant set isHost=true for newHost.userId
  broadcast host-change { newHostSocketId, newHostUserId, displayName }
```

### Reconnection (within 30s)

```
On socket disconnect:
  store { userId, roomId, playbackState, disconnectedAt } in memory (TTL 30s)

On join-room with same userId + roomId within 30s:
  restore participant session
  send current room-state (no re-broadcast of join to others)
  clear TTL entry
```

---

## API Routes

### `POST /api/cinema-room/create`

```typescript
// Request body: none (user from Clerk session)
// Response: { roomId: string, roomLink: string }

// Logic:
// 1. serverAuth(req) → currentUser
// 2. generate roomId = nanoid(8)
// 3. prismadb.cinemaRoom.create({ roomId, hostUserId, playbackState: initial, isActive: true })
// 4. prismadb.cinemaRoomParticipant.create({ roomId, userId, isHost: true })
// 5. return { roomId, roomLink: `/cinema-room/${roomId}` }
```

### `GET /api/cinema-room/[roomId]`

```typescript
// Response: { room: CinemaRoom, participants: CinemaRoomParticipant[] } | 404
```

### `POST /api/cinema-room/[roomId]/join`

```typescript
// Records participant in DB (upsert)
// Response: { room: CinemaRoom } | 404 | 401
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| Room not found (join/GET) | REST: 404 + redirect to `/`; Socket: emit `error { code: 404 }` |
| Unauthenticated access | REST: 401; Socket: disconnect with `error { code: 401 }` |
| Non-host playback action | Socket: emit `error { code: 403, message: 'Host only' }` to sender only |
| DB error on create | REST: 500 with descriptive message |
| getUserMedia denied | Catch `NotAllowedError`, set `audioEnabled=false` or `videoEnabled=false`, show permission-denied indicator in UI |
| WebRTC connection failure | `RTCPeerConnection.oniceconnectionstatechange` → if `failed`, retry once with `restartIce()`, then show "connection lost" indicator |
| Socket disconnect | Client auto-reconnects (Socket.io default); server holds session for 30s |
| All participants leave | Room marked `isActive: false` in DB |

---

## Testing Strategy

### Unit Tests

Focus on specific examples, edge cases, and pure functions:

- `RoomManager.promoteHost` — correct participant selected when host leaves
- `RoomManager.handleBufferResolved` — play only broadcast when buffering set is empty
- Room clock calculation — `currentPosition(startTimestamp, startedAt, now)`
- `POST /api/cinema-room/create` — returns roomId and correct link format
- `GET /api/cinema-room/[roomId]` — 404 for non-existent room
- Auth middleware — 401 for unauthenticated requests
- `getUserMedia` constraints — audio constraints include echoCancellation, noiseSuppression, autoGainControl

### Property-Based Testing

Uses **fast-check** (TypeScript property-based testing library).

Each property test runs a minimum of **100 iterations** (fast-check default is 100; set explicitly via `{ numRuns: 100 }`).

Tag format: `// Feature: cinema-room, Property N: <property text>`

Each of the 18 correctness properties above maps to exactly one property-based test. Examples:

```typescript
// Feature: cinema-room, Property 1: Room creation invariants
it('creates rooms with unique IDs and correct link format', () =>
  fc.assert(fc.asyncProperty(fc.string(), async (userId) => {
    const room = await createRoom(userId);
    expect(room.roomLink).toBe(`/cinema-room/${room.roomId}`);
    // uniqueness checked across multiple creations in separate test
  }), { numRuns: 100 })
);

// Feature: cinema-room, Property 16: Host promotion selects earliest-joined participant
it('promotes the earliest-joined participant when host leaves', () =>
  fc.assert(fc.property(
    fc.array(fc.record({ userId: fc.string(), joinedAt: fc.date() }), { minLength: 2 }),
    (participants) => {
      const sorted = [...participants].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
      const newHost = promoteHost(participants[0].userId, participants);
      expect(newHost.userId).toBe(sorted[0].userId);
    }
  ), { numRuns: 100 })
);
```

**Unit tests cover:**
- Specific examples: room creation success/failure, 404 for missing room, 401 for unauth
- Error conditions: DB failure returns 500, non-host action returns 403
- getUserMedia constraints object shape (echoCancellation, noiseSuppression, autoGainControl all true)
- Reconnection within 30s restores session (example with mocked timers)
- Last participant leaving marks room inactive


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Room Creation Invariants

*For any* authenticated user, creating a Cinema Room should produce a room with a unique roomId (not matching any existing room) and a Room_Link in the exact format `/cinema-room/{roomId}`.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Room Creation Persistence Round-Trip

*For any* authenticated user who creates a Cinema Room, reading the room back from the database should return a record with the correct hostUserId, a non-null createdAt timestamp, and an initial PlaybackState of `{ contentId: null, startTimestamp: 0, startedAt: null, isPlaying: false }`.

**Validates: Requirements 1.3**

---

### Property 3: Unauthenticated Requests Rejected

*For any* request to create or join a Cinema Room that does not include a valid authentication token, the system should return HTTP 401.

**Validates: Requirements 1.4, 2.5**

---

### Property 4: Join Round-Trip

*For any* authenticated user joining a valid Cinema Room, the participant list should contain that user after joining, and the joining participant should receive the room's current PlaybackState.

**Validates: Requirements 2.1, 2.3**

---

### Property 5: Non-Existent Room Returns 404

*For any* roomId that does not correspond to an existing Cinema Room, the GET room endpoint should return HTTP 404.

**Validates: Requirements 2.4**

---

### Property 6: Sync Events Broadcast to All Participants

*For any* Cinema Room with N connected participants, when the host emits a sync event (play, pause, seek, content-change, or participant-joined), all N participants should receive that event exactly once.

**Validates: Requirements 2.2, 3.2, 4.1, 4.2, 4.3**

---

### Property 7: Playback State Persistence

*For any* host-issued playback event (play, pause, seek, content-change), the Cinema Room's PlaybackState stored in the database should reflect the new state immediately after the event is processed.

**Validates: Requirements 3.1, 8.5**

---

### Property 8: Player Reflects Sync Events

*For any* sync event received by a VideoPanel (play with timestamp T, pause with timestamp T, seek with timestamp T), the component's resulting state should have `startTimestamp = T` and `isPlaying` matching the event type (true for play, false for pause, preserved for seek).

**Validates: Requirements 3.3, 4.4, 4.5, 4.6**

---

### Property 9: Non-Host Actions Rejected with 403

*For any* participant who is not the current host of a Cinema Room, emitting a host-only event (play, pause, seek, content-change) should result in the server emitting an `error` event with code 403 back to that participant only, with no broadcast to the room.

**Validates: Requirements 3.4, 4.7**

---

### Property 10: Buffer-Start Triggers Pause and Latency Indicator for All

*For any* Cinema Room with N participants, when any one participant emits `buffer-start`, all N participants (including the buffering one) should receive both a `pause` sync event and a `latency-indicator` event identifying the buffering participant by display name.

**Validates: Requirements 5.2, 5.3**

---

### Property 11: Buffer-Resolved Triggers Play and Dismiss Indicator for All

*For any* Cinema Room where exactly one participant is buffering, when that participant emits `buffer-resolved`, all participants should receive both a `play` sync event and a `dismiss-latency-indicator` event. If multiple participants are buffering, `buffer-resolved` from one should not trigger a play broadcast until all have resolved.

**Validates: Requirements 5.6, 5.7**

---

### Property 12: WebRTC Connections Initiated for All Existing Participants on Join

*For any* Cinema Room with N existing participants, when a new participant joins, the new participant should initiate exactly N WebRTC offer exchanges (one per existing participant).

**Validates: Requirements 6.1**

---

### Property 13: Media Track Toggle Round-Trip

*For any* participant with an active local media stream, toggling a track off (mute audio or disable video) should set that track's `enabled` to `false`, and toggling it back on should restore `enabled` to `true`, leaving all other tracks unaffected.

**Validates: Requirements 6.3, 6.4, 6.5, 6.6**

---

### Property 14: Content-Change Event Payload Contains Only Sync Data

*For any* content-change event broadcast by the Sync_Server, the event payload should contain only `contentId` and playback state fields — it should not contain any video stream data, binary blobs, or URLs to proxied video.

**Validates: Requirements 7.3**

---

### Property 15: URL Resolution Matches Streaming Service

*For any* contentId (Movie record), the URL generated by the VideoPanel for the iframe src should be identical to the URL produced by `streamingService.getMovieStreamSources(imdbId, tmdbId)[0].url` for the same content.

**Validates: Requirements 7.4**

---

### Property 16: Host Promotion Selects Earliest-Joined Participant

*For any* Cinema Room with N ≥ 2 participants with distinct `joinedAt` timestamps, when the current host disconnects, the participant with the smallest (earliest) `joinedAt` value among the remaining participants should be promoted to host, and all remaining participants should receive a `host-change` event identifying the new host.

**Validates: Requirements 8.1, 8.2**

---

### Property 17: Participant Leave Broadcast

*For any* Cinema Room with N participants, when one participant disconnects, the remaining N-1 participants should each receive exactly one `participant-left` event identifying the departed participant.

**Validates: Requirements 8.3**

---

### Property 18: Participant List Rendering Reflects All Participants with Correct Indicators

*For any* list of participants with varying mute, camera, and host states, the rendered ParticipantGrid should contain one tile per participant, each tile showing the correct display name, a mute indicator if and only if that participant is muted, a camera-off indicator if and only if that participant has video disabled, and a host indicator if and only if that participant is the host.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**
