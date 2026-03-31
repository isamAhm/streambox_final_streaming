import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowLeftIcon, ListBulletIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import HLSPlayer from '@/components/HLSPlayer';

interface ServerOption { server: string; embedUrl: string; }
interface HLSSource { url: string; isM3U8: boolean; quality?: string; }
interface Subtitle { url: string; lang: string; default: boolean; }

type StreamData =
    | { type: 'hls'; sources: HLSSource[]; subtitles: Subtitle[]; server: string }
    | { type: 'embed'; servers: ServerOption[] };

interface Episode { id: string; number: number; title: string; image: string | null; }

const SERVER_LABELS: Record<string, string> = {
    vidsrc: 'VidSrc', megacloud: 'MegaCloud', 't-cloud': 'T-Cloud',
};

export default function AnimeWatchPage() {
    const router = useRouter();
    const { episodeId, animeId, ep, title: animeTitle, dub } = router.query as {
        episodeId: string; animeId: string; ep: string; title?: string; dub?: string;
    };

    const [streamData, setStreamData] = useState<StreamData | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedQuality, setSelectedQuality] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Episodes drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [epsLoading, setEpsLoading] = useState(false);
    const activeEpRef = useRef<HTMLButtonElement>(null);

    const title = animeTitle ? decodeURIComponent(animeTitle) : 'Anime';
    const currentEpNum = parseInt(ep) || 0;

    useEffect(() => {
        if (!episodeId) return;
        setLoading(true);
        setError('');
        setStreamData(null);
        setActiveIndex(0);
        setSelectedQuality('');

        axios.get(`/api/anime/stream?episodeId=${encodeURIComponent(episodeId)}&dub=${dub || 'false'}`)
            .then(r => {
                setStreamData(r.data);
                if (r.data.type === 'hls') {
                    setSelectedQuality(r.data.sources?.[0]?.quality || 'auto');
                }
            })
            .catch(() => setError('Failed to load stream.'))
            .finally(() => setLoading(false));
    }, [episodeId, dub]);

    useEffect(() => {
        if (!drawerOpen || episodes.length > 0 || !animeId) return;
        setEpsLoading(true);
        axios.get(`/api/anime/info/${animeId}?dub=${dub || 'false'}`)
            .then(r => setEpisodes(r.data.episodes || []))
            .catch(() => { })
            .finally(() => setEpsLoading(false));
    }, [drawerOpen, animeId]);

    useEffect(() => {
        if (drawerOpen && activeEpRef.current) {
            setTimeout(() => activeEpRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
        }
    }, [drawerOpen, episodes]);

    const handleEpisodeClick = (ep: Episode) => {
        setDrawerOpen(false);
        const titleParam = encodeURIComponent(title);
        router.push(`/anime/watch/${encodeURIComponent(ep.id)}?animeId=${animeId}&ep=${ep.number}&dub=${dub || 'false'}&title=${titleParam}`);
    };

    // For HLS: current source based on quality selection
    const hlsSrc = streamData?.type === 'hls'
        ? (streamData.sources.find(s => s.quality === selectedQuality) || streamData.sources[0])?.url
        : null;

    // For embed: active server
    const activeServer = streamData?.type === 'embed' ? streamData.servers[activeIndex] : null;

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0 flex-wrap">
                <button onClick={() => router.push(`/anime/${animeId}?dub=${dub || 'false'}`)} className="text-zinc-400 hover:text-white transition shrink-0">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>

                <span className="text-white text-sm font-medium truncate flex-1 min-w-0">
                    {title} — Episode {ep}
                    {dub === 'true' && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">DUB</span>}
                </span>

                {/* Episodes button */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition shrink-0"
                >
                    <ListBulletIcon className="w-4 h-4" />
                    Episodes
                </button>

                {/* HLS quality selector */}
                {streamData?.type === 'hls' && streamData.sources.length > 1 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-zinc-500 text-xs">Quality:</span>
                        <select
                            value={selectedQuality}
                            onChange={e => setSelectedQuality(e.target.value)}
                            className="bg-zinc-800 text-white text-xs px-2 py-1 rounded border border-zinc-700 outline-none cursor-pointer"
                        >
                            {streamData.sources.map(s => (
                                <option key={s.quality} value={s.quality}>{s.quality}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Embed server selector */}
                {streamData?.type === 'embed' && streamData.servers.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-zinc-500 text-xs mr-1">Server:</span>
                        {streamData.servers.map((s, i) => (
                            <button
                                key={s.server}
                                onClick={() => setActiveIndex(i)}
                                className={`text-xs px-3 py-1 rounded transition font-medium ${i === activeIndex ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                            >
                                {SERVER_LABELS[s.server.toLowerCase()] ?? s.server}
                            </button>
                        ))}
                    </div>
                )}

                {/* HLS server label */}
                {streamData?.type === 'hls' && (
                    <span className="text-zinc-500 text-xs shrink-0">{SERVER_LABELS[streamData.server.toLowerCase()] ?? streamData.server}</span>
                )}
            </div>

            {/* Player */}
            <div className="flex-1 flex items-center justify-center bg-black">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-blue-800/30 rounded-full" />
                            <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin" />
                        </div>
                    </div>
                )}
                {error && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={() => { setError(''); setLoading(true); router.replace(router.asPath); }}
                            className="bg-white text-black text-sm px-4 py-2 rounded hover:bg-gray-200 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* HLS player */}
                {!loading && !error && streamData?.type === 'hls' && hlsSrc && (
                    <div className="w-full h-full" style={{ minHeight: 'calc(100vh - 53px)' }}>
                        <HLSPlayer
                            key={hlsSrc}
                            src={hlsSrc}
                            autoPlay
                            className="h-full"
                            onFatalError={() => setError('Stream failed. Try refreshing.')}
                        />
                    </div>
                )}

                {/* Embed iframe fallback */}
                {!loading && !error && streamData?.type === 'embed' && activeServer && (
                    <iframe
                        key={activeServer.embedUrl}
                        src={activeServer.embedUrl}
                        className="w-full h-full"
                        style={{ minHeight: 'calc(100vh - 53px)' }}
                        allowFullScreen
                        allow="autoplay; fullscreen; picture-in-picture"
                        referrerPolicy="no-referrer"
                        title={`${title} Episode ${ep}`}
                    />
                )}
            </div>

            {/* Episodes drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="w-80 max-w-full bg-zinc-950 border-l border-zinc-800 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                            <div>
                                <p className="text-white text-sm font-semibold">Episodes</p>
                                <p className="text-zinc-500 text-xs truncate max-w-[200px]">{title}</p>
                            </div>
                            <button onClick={() => setDrawerOpen(false)} className="text-zinc-400 hover:text-white transition">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-modern">
                            {epsLoading && (
                                <div className="flex items-center justify-center py-16">
                                    <div className="relative w-8 h-8">
                                        <div className="absolute inset-0 border-4 border-blue-800/30 rounded-full" />
                                        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin" />
                                    </div>
                                </div>
                            )}
                            {!epsLoading && episodes.length === 0 && (
                                <p className="text-zinc-500 text-sm text-center py-12">No episodes found</p>
                            )}
                            {!epsLoading && episodes.map(ep => {
                                const isActive = ep.number === currentEpNum;
                                return (
                                    <button
                                        key={ep.id}
                                        ref={isActive ? activeEpRef : undefined}
                                        onClick={() => handleEpisodeClick(ep)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-b border-zinc-900 group ${isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}
                                    >
                                        <div className="relative shrink-0 w-20 h-12 rounded overflow-hidden bg-zinc-800">
                                            {ep.image
                                                ? <img src={ep.image} alt={`Ep ${ep.number}`} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-medium">{ep.number}</div>
                                            }
                                            {isActive && (
                                                <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                                                    <PlayIcon className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${isActive ? 'text-blue-400' : 'text-white'}`}>Episode {ep.number}</p>
                                            {ep.title && <p className="text-zinc-500 text-xs truncate mt-0.5">{ep.title}</p>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
