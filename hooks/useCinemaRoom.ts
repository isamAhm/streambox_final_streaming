import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

export interface Participant {
    socketId: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    isHost: boolean;
    isMuted?: boolean;
    isCameraOff?: boolean;
}

export interface MovieInfo {
    id: string;
    title: string;
    thumbnailUrl?: string;
    imdbId: string;
    tmdbId?: number;
    type?: string;
}

export interface PlaybackState {
    contentId: string | null;
    startTimestamp: number;
    startedAt: number | null;
    isPlaying: boolean;
}

interface UseCinemaRoomOptions {
    roomId: string;
    enabled: boolean;
}

export function useCinemaRoom({ roomId, enabled }: UseCinemaRoomOptions) {
    const { user } = useUser();
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        contentId: null, startTimestamp: 0, startedAt: null, isPlaying: false,
    });
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const [bufferingUsers, setBufferingUsers] = useState<{ userId: string; displayName: string }[]>([]);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    // Init local media
    const initMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err: unknown) {
            const error = err as { name?: string };
            if (error.name === 'NotAllowedError') {
                setMediaError('Camera/microphone permission denied');
                // Try audio only
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    });
                    localStreamRef.current = audioStream;
                    setLocalStream(audioStream);
                    return audioStream;
                } catch {
                    setMediaError('Microphone permission denied');
                }
            }
            return null;
        }
    }, []);

    // Create peer connection for a remote participant
    const createPeerConnection = useCallback((targetSocketId: string, stream: MediaStream | null) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        pc.ontrack = (event) => {
            setRemoteStreams((prev) => {
                const next = new Map(prev);
                next.set(targetSocketId, event.streams[0]);
                return next;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('webrtc-ice-candidate', {
                    targetSocketId,
                    candidate: event.candidate,
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'failed') {
                pc.restartIce();
            }
        };

        peerConnectionsRef.current.set(targetSocketId, pc);
        return pc;
    }, []);

    useEffect(() => {
        if (!enabled || !user || !roomId) return;

        let mounted = true;

        const setup = async () => {
            const stream = await initMedia();

            // Fetch room info to get the authoritative hostUserId before connecting
            let hostUserId: string | null = null;
            try {
                const res = await fetch(`/api/cinema-room/${roomId}/join`, { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    hostUserId = data.hostUserId ?? null;
                }
            } catch { /* non-critical */ }

            const socket = io({ path: '/socket.io' });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join-room', {
                    roomId,
                    userId: user.id,
                    displayName: user.fullName || user.username || 'Guest',
                    avatarUrl: user.imageUrl,
                    hostUserId,
                });
            });

            socket.on('room-state', ({ participants: parts, playbackState: ps, movie: mv }) => {
                if (!mounted) return;
                // Deduplicate by userId — keep last entry per userId
                const deduped: Participant[] = Array.from(
                    new Map((parts as Participant[]).map((p: Participant) => [p.userId, p])).values()
                );
                setParticipants(deduped);
                setPlaybackState(ps);
                if (mv) setSelectedMovie(mv);
                const me = deduped.find((p: Participant) => p.userId === user.id);
                setIsHost(me?.isHost ?? false);

                // Initiate WebRTC offers to all existing participants
                deduped.forEach(async (p: Participant) => {
                    if (p.userId === user.id) return;
                    const pc = createPeerConnection(p.socketId, stream);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('webrtc-offer', { targetSocketId: p.socketId, sdp: offer });
                });
            });

            socket.on('participant-joined', (p: Participant) => {
                if (!mounted) return;
                // Replace any existing entry with the same userId or socketId
                setParticipants((prev) => [
                    ...prev.filter((x) => x.userId !== p.userId && x.socketId !== p.socketId),
                    p,
                ]);
            });

            socket.on('participant-left', ({ socketId }) => {
                if (!mounted) return;
                setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
                peerConnectionsRef.current.get(socketId)?.close();
                peerConnectionsRef.current.delete(socketId);
                setRemoteStreams((prev) => { const n = new Map(prev); n.delete(socketId); return n; });
            });

            socket.on('play', ({ timestamp, startedAt }) => {
                if (!mounted) return;
                setPlaybackState((prev) => ({ ...prev, startTimestamp: timestamp, startedAt, isPlaying: true }));
            });

            socket.on('pause', ({ timestamp }) => {
                if (!mounted) return;
                setPlaybackState((prev) => ({ ...prev, startTimestamp: timestamp, startedAt: null, isPlaying: false }));
            });

            socket.on('content-change', ({ contentId, movie }) => {
                if (!mounted) return;
                setPlaybackState({ contentId, startTimestamp: 0, startedAt: null, isPlaying: false });
                if (movie) setSelectedMovie(movie);
            });

            socket.on('latency-indicator', (data) => {
                if (!mounted) return;
                setBufferingUsers((prev) => [...prev.filter((u) => u.userId !== data.userId), data]);
            });

            socket.on('dismiss-latency-indicator', ({ userId }) => {
                if (!mounted) return;
                setBufferingUsers((prev) => prev.filter((u) => u.userId !== userId));
            });

            socket.on('host-change', ({ newHostUserId }) => {
                if (!mounted) return;
                setIsHost(newHostUserId === user.id);
                setParticipants((prev) =>
                    prev.map((p) => ({ ...p, isHost: p.userId === newHostUserId }))
                );
            });

            // WebRTC signaling
            socket.on('webrtc-offer', async ({ fromSocketId, sdp }) => {
                const pc = createPeerConnection(fromSocketId, stream);
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc-answer', { targetSocketId: fromSocketId, sdp: answer });
            });

            socket.on('webrtc-answer', async ({ fromSocketId, sdp }) => {
                const pc = peerConnectionsRef.current.get(fromSocketId);
                if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            });

            socket.on('webrtc-ice-candidate', async ({ fromSocketId, candidate }) => {
                const pc = peerConnectionsRef.current.get(fromSocketId);
                if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
            });
        };

        setup();

        return () => {
            mounted = false;
            // Don't emit leave-room manually — let the socket disconnect event handle cleanup
            // This prevents React strict mode double-mount from destroying the room
            socketRef.current?.disconnect();
            peerConnectionsRef.current.forEach((pc) => pc.close());
            peerConnectionsRef.current.clear();
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [enabled, user, roomId, initMedia, createPeerConnection]);

    // Emit helpers
    const emitPlay = useCallback((timestamp: number) => {
        socketRef.current?.emit('play', { roomId, timestamp });
    }, [roomId]);

    const emitPause = useCallback((timestamp: number) => {
        socketRef.current?.emit('pause', { roomId, timestamp });
    }, [roomId]);

    const emitContentChange = useCallback((movie: MovieInfo) => {
        socketRef.current?.emit('content-change', { roomId, contentId: movie.id, movie });
    }, [roomId]);

    const emitBufferStart = useCallback(() => {
        socketRef.current?.emit('buffer-start', { roomId });
    }, [roomId]);

    const emitBufferResolved = useCallback(() => {
        socketRef.current?.emit('buffer-resolved', { roomId });
    }, [roomId]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    }, []);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    }, []);

    const leaveRoom = useCallback(() => {
        socketRef.current?.emit('leave-room', { roomId });
        socketRef.current?.disconnect();
    }, [roomId]);

    return {
        participants,
        playbackState,
        selectedMovie,
        bufferingUsers,
        localStream,
        remoteStreams,
        isHost,
        mediaError,
        emitPlay,
        emitPause,
        emitContentChange,
        emitBufferStart,
        emitBufferResolved,
        toggleMute,
        toggleCamera,
        leaveRoom,
    };
}
