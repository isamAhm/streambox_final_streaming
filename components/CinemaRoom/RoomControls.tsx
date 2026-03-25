import React, { useState } from 'react';
import {
    PlayIcon,
    PauseIcon,
    MicrophoneIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RoomControlsProps {
    isHost: boolean;
    isPlaying: boolean;
    currentTimestamp: number;
    onPlay: () => void;
    onPause: () => void;
    onBufferStart: () => void;
    onLeave: () => void;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    isMuted: boolean;
    isCameraOff: boolean;
}

const RoomControls: React.FC<RoomControlsProps> = ({
    isHost,
    isPlaying,
    onPlay,
    onPause,
    onBufferStart,
    onLeave,
    onToggleMute,
    onToggleCamera,
    isMuted,
    isCameraOff,
}) => {
    const [showBufferConfirm, setShowBufferConfirm] = useState(false);

    return (
        <div className="flex items-center justify-between bg-zinc-900 border-t border-zinc-800 px-4 md:px-12 py-3 gap-4 flex-wrap shrink-0">

            {/* Left: playback controls (host only) */}
            <div className="flex items-center gap-3">
                {isHost && (
                    <>
                        <button
                            onClick={isPlaying ? onPause : onPlay}
                            className="bg-white hover:bg-gray-200 text-black rounded-full p-2.5 transition"
                            title={isPlaying ? 'Pause for everyone' : 'Play for everyone'}
                        >
                            {isPlaying
                                ? <PauseIcon className="w-5 h-5" />
                                : <PlayIcon className="w-5 h-5" />
                            }
                        </button>

                        {/* Seek — coming soon */}
                        <div className="relative group flex items-center gap-2">
                            <input
                                type="range"
                                min={0} max={100} value={0}
                                disabled
                                className="w-28 md:w-40 cursor-not-allowed opacity-30"
                                aria-label="Seek (coming soon)"
                            />
                            <span className="text-zinc-500 text-xs">Seek</span>
                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                                Seek sync coming soon
                            </span>
                        </div>
                    </>
                )}

                {/* Buffering button */}
                {isHost && !showBufferConfirm && (
                    <button
                        onClick={() => setShowBufferConfirm(true)}
                        className="text-xs text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-lg hover:bg-yellow-400/10 transition"
                    >
                        I&apos;m buffering
                    </button>
                )}
                {isHost && showBufferConfirm && (
                    <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-gray-300">Pause for everyone?</span>
                        <button
                            onClick={() => { onBufferStart(); setShowBufferConfirm(false); }}
                            className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black px-2 py-1 rounded font-semibold transition"
                        >
                            Yes
                        </button>
                        <button onClick={() => setShowBufferConfirm(false)} className="text-gray-400 hover:text-white transition">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!isHost && (
                    <span className="text-zinc-600 text-xs">Host controls playback</span>
                )}
            </div>

            {/* Right: media + leave */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleMute}
                    className={`rounded-full p-2.5 transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    <MicrophoneIcon className="w-4 h-4 text-white" />
                </button>

                <button
                    onClick={onToggleCamera}
                    className={`rounded-full p-2.5 transition ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                >
                    {isCameraOff
                        ? <VideoCameraSlashIcon className="w-4 h-4 text-white" />
                        : <VideoCameraIcon className="w-4 h-4 text-white" />
                    }
                </button>

                <button
                    onClick={onLeave}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                    title="Leave room"
                >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Leave
                </button>
            </div>
        </div>
    );
};

export default RoomControls;
