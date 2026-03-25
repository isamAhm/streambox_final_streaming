import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useCinemaRoom, MovieInfo } from '@/hooks/useCinemaRoom';
import VideoPanel from '@/components/CinemaRoom/VideoPanel';
import ParticipantGrid from '@/components/CinemaRoom/ParticipantGrid';
import RoomControls from '@/components/CinemaRoom/RoomControls';
import ContentPicker from '@/components/CinemaRoom/ContentPicker';
import { FilmIcon, ClipboardDocumentIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CinemaRoomPage() {
    const router = useRouter();
    const { roomId } = router.query as { roomId: string };
    const { user, isSignedIn, isLoaded } = useUser();

    const [showPicker, setShowPicker] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
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
    } = useCinemaRoom({ roomId, enabled: !!roomId && isSignedIn === true });

    const handleSelectMovie = useCallback(async (movie: MovieInfo) => {
        emitContentChange(movie);
    }, [emitContentChange]);

    const handleLeave = useCallback(() => {
        leaveRoom();
        router.push('/');
    }, [leaveRoom, router]);

    const handleToggleMute = useCallback(() => {
        toggleMute();
        setIsMuted((p) => !p);
    }, [toggleMute]);

    const handleToggleCamera = useCallback(() => {
        toggleCamera();
        setIsCameraOff((p) => !p);
    }, [toggleCamera]);

    const handlePlay = useCallback(() => {
        emitPlay(playbackState.startTimestamp);
    }, [emitPlay, playbackState.startTimestamp]);

    const handlePause = useCallback(() => {
        emitPause(playbackState.startTimestamp);
    }, [emitPause, playbackState.startTimestamp]);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    // All hooks above — safe to early return now
    if (isLoaded && !isSignedIn) {
        router.push(`/auth?redirect=/cinema-room/${roomId}`);
        return null;
    }

    if (!isLoaded) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">

            {/* Room header */}
            <div className="px-4 md:px-8 py-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={handleLeave} className="text-zinc-400 hover:text-white transition" title="Back to home">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <FilmIcon className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">Cinema Room</span>
                    <span className="text-zinc-500 text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded hidden sm:inline">
                        {roomId}
                    </span>
                    {mediaError && (
                        <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded hidden sm:inline">
                            {mediaError}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isHost && (
                        <button
                            onClick={() => setShowPicker(true)}
                            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold px-3 py-2 rounded-lg transition"
                        >
                            <FilmIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Choose Movie</span>
                        </button>
                    )}
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-2 rounded-lg transition"
                    >
                        {copied
                            ? <CheckIcon className="w-4 h-4 text-green-400" />
                            : <ClipboardDocumentIcon className="w-4 h-4" />
                        }
                        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

                {/* Video */}
                <div className="flex-1 bg-black min-h-0">
                    <VideoPanel
                        movie={selectedMovie}
                        playbackState={playbackState}
                        bufferingUsers={bufferingUsers}
                        onBufferStart={emitBufferStart}
                        onBufferResolved={emitBufferResolved}
                        isHost={isHost}
                    />
                </div>

                {/* Participants sidebar */}
                <div className="lg:w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden shrink-0">
                    <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
                        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                            Participants ({participants.length})
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ParticipantGrid
                            participants={participants}
                            localStream={localStream}
                            remoteStreams={remoteStreams}
                            localUserId={user?.id ?? ''}
                        />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <RoomControls
                isHost={isHost}
                isPlaying={playbackState.isPlaying}
                currentTimestamp={playbackState.startTimestamp}
                onPlay={handlePlay}
                onPause={handlePause}
                onBufferStart={emitBufferStart}
                onLeave={handleLeave}
                onToggleMute={handleToggleMute}
                onToggleCamera={handleToggleCamera}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
            />

            {showPicker && (
                <ContentPicker
                    isHost={isHost}
                    onSelect={handleSelectMovie}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}
