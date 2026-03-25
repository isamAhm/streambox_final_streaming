import React, { useEffect, useRef } from 'react';
import { Participant } from '@/hooks/useCinemaRoom';
import { MicrophoneIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid';

function ParticipantTile({
    participant,
    stream,
    isLocal,
}: {
    participant: Participant;
    stream: MediaStream | null;
    isLocal: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-zinc-800 rounded-lg overflow-hidden aspect-video">
            {stream && !participant.isCameraOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    {participant.avatarUrl ? (
                        <img
                            src={participant.avatarUrl}
                            alt={participant.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-600 flex items-center justify-center text-white text-xl font-bold">
                            {participant.displayName[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 flex items-center justify-between">
                <span className="text-white text-xs font-medium truncate flex items-center gap-1">
                    {participant.isHost && <span title="Host">👑</span>}
                    {participant.displayName}
                    {isLocal && <span className="text-zinc-400"> (You)</span>}
                </span>
                <div className="flex gap-1 shrink-0">
                    {participant.isMuted && (
                        <span className="bg-red-600 rounded p-0.5" title="Muted">
                            <MicrophoneIcon className="w-2.5 h-2.5 text-white" />
                        </span>
                    )}
                    {participant.isCameraOff && (
                        <span className="bg-red-600 rounded p-0.5" title="Camera off">
                            <VideoCameraSlashIcon className="w-2.5 h-2.5 text-white" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ParticipantGridProps {
    participants: Participant[];
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    localUserId: string;
}

const ParticipantGrid: React.FC<ParticipantGridProps> = ({
    participants,
    localStream,
    remoteStreams,
    localUserId,
}) => {
    if (participants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <p className="text-zinc-500 text-sm">Waiting for participants...</p>
            </div>
        );
    }

    return (
        <div className="p-2 space-y-2">
            {participants.map((p) => (
                <ParticipantTile
                    key={p.socketId}
                    participant={p}
                    stream={p.userId === localUserId ? localStream : (remoteStreams.get(p.socketId) ?? null)}
                    isLocal={p.userId === localUserId}
                />
            ))}
        </div>
    );
};

export default ParticipantGrid;
