import React, { useEffect, useState } from 'react';
import { PlaybackState } from '@/hooks/useCinemaRoom';
import { streamingService, StreamingSource } from '@/libs/streaming';
import { FilmIcon } from '@heroicons/react/24/outline';

interface Movie {
    imdbId: string;
    tmdbId?: number;
    title: string;
    type?: string;
}

interface VideoPanelProps {
    movie: Movie | null;
    playbackState: PlaybackState;
    bufferingUsers: { userId: string; displayName: string }[];
    onBufferStart: () => void;
    onBufferResolved: () => void;
    isHost: boolean;
}

const VideoPanel: React.FC<VideoPanelProps> = ({
    movie,
    playbackState,
    bufferingUsers,
    onBufferResolved,
    isHost,
}) => {
    const [sources, setSources] = useState<StreamingSource[]>([]);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    // Only increment on movie change — NOT on play/pause (that caused restart-from-0)
    const [iframeKey, setIframeKey] = useState(0);

    useEffect(() => {
        if (!movie?.imdbId) return;
        try {
            const s = movie.type === 'tv'
                ? streamingService.getTVShowStreamSources(movie.imdbId, 1, 1, movie.tmdbId)
                : streamingService.getMovieStreamSources(movie.imdbId, movie.tmdbId);
            setSources(s);
            setCurrentSourceIndex(0);
            setIframeKey((k) => k + 1); // reload only when movie changes
        } catch {
            setSources([]);
        }
    }, [movie?.imdbId, movie?.tmdbId, movie?.type]);

    if (!movie || sources.length === 0) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-4">
                <div className="bg-zinc-800 rounded-full p-6">
                    <FilmIcon className="w-12 h-12 text-zinc-500" />
                </div>
                <p className="text-zinc-400 text-lg font-medium">No movie selected</p>
                <p className="text-zinc-600 text-sm">The host will choose a movie to watch</p>
            </div>
        );
    }

    const currentSource = sources[currentSourceIndex];
    const isPaused = !playbackState.isPlaying;

    return (
        <div className="relative w-full h-full bg-black">

            {/* Source selector — top right */}
            {sources.length > 1 && (
                <div className="absolute top-4 right-4 z-50">
                    <select
                        value={currentSourceIndex}
                        onChange={(e) => setCurrentSourceIndex(parseInt(e.target.value))}
                        className="bg-black/70 hover:bg-black/90 text-white text-sm px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 focus:outline-none focus:border-blue-500 transition-all backdrop-blur-sm cursor-pointer"
                    >
                        {sources.map((source, index) => (
                            <option key={index} value={index}>
                                {source.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Player — always mounted, runs underneath overlays */}
            <iframe
                key={`${currentSource.url}-${iframeKey}`}
                src={currentSource.url}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="origin"
                title={movie.title}
                onLoad={onBufferResolved}
            />

            {/* Interaction blocker for non-host — prevents clicking inside the iframe */}
            {!isHost && (
                <div className="absolute inset-0 z-10" style={{ cursor: 'default' }} />
            )}

            {/* Pause overlay — covers iframe for EVERYONE when paused.
                The iframe keeps running underneath but is hidden.
                When host resumes, overlay lifts and everyone is at the same position. */}
            {isPaused && (
                <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                            {isHost ? (
                                // Host sees pause icon — they know they paused it
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                // Participants see play icon — waiting for host
                                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </div>
                        <p className="text-white text-sm font-medium">
                            {isHost ? 'Paused — press play to resume for everyone' : 'Waiting for host to resume'}
                        </p>
                    </div>
                </div>
            )}

            {/* Latency banner */}
            {bufferingUsers.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-zinc-700 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full shrink-0" />
                    <span>
                        <span className="font-semibold">{bufferingUsers.map((u) => u.displayName).join(', ')}</span>
                        {' '}{bufferingUsers.length === 1 ? 'is' : 'are'} experiencing network latency
                    </span>
                </div>
            )}
        </div>
    );
};

export default VideoPanel;
