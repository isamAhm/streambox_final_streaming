import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LoadingAnimation } from '@/components/loading-animation';
import { PlayIcon } from '@heroicons/react/24/solid';

interface Episode {
    id: string;
    number: number;
    title?: string;
    image?: string;
}

interface AnimeInfo {
    id: string;
    title: { romaji: string; english: string | null; native: string };
    image: string;
    cover?: string;
    description?: string;
    rating?: number;
    releaseDate?: number;
    status?: string;
    totalEpisodes?: number;
    genres?: string[];
    type?: string;
    episodes: Episode[];
}

interface Season {
    id: number;
    title: string;
    episodes?: number;
    year?: number;
    image?: string;
    status?: string;
}

const CHUNK = 50;

export default function AnimeDetailPage() {
    const router = useRouter();
    const { animeId, dub: dubQuery } = router.query as { animeId: string; dub?: string };

    const [info, setInfo] = useState<AnimeInfo | null>(null);
    const [isDub, setIsDub] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dubLoading, setDubLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(0);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [currentSeasonIndex, setCurrentSeasonIndex] = useState(0);

    const fetchInfo = useCallback(async (dub: boolean, isInitial = false) => {
        if (!animeId) return;
        if (isInitial) setLoading(true);
        else setDubLoading(true);
        try {
            const res = await axios.get(`/api/anime/info/${animeId}?dub=${dub}`);
            setInfo(res.data);
        } catch {
            setInfo(null);
        } finally {
            setLoading(false);
            setDubLoading(false);
        }
    }, [animeId]);

    useEffect(() => {
        if (!router.isReady || !animeId) return;
        const startAsDub = dubQuery === 'true';
        setIsDub(startAsDub);
        fetchInfo(startAsDub, true);
        axios.get(`/api/anime/seasons/${animeId}`)
            .then(r => {
                setSeasons(r.data.seasons || []);
                setCurrentSeasonIndex(r.data.currentSeasonIndex || 0);
            })
            .catch(() => setSeasons([]));
    }, [router.isReady, animeId]);

    const handleDubToggle = (dub: boolean) => {
        setIsDub(dub);
        setSelectedPart(0);
        fetchInfo(dub, false);
    };

    const handleWatch = (ep: Episode) => {
        const titleParam = encodeURIComponent(info?.title.english || info?.title.romaji || '');
        router.push(
            `/anime/watch/${encodeURIComponent(ep.id)}?animeId=${animeId}&ep=${ep.number}&dub=${isDub}&title=${titleParam}`
        );
    };

    // Episode pagination — memoised so it doesn't recompute on every render
    const { parts, visibleEps } = useMemo(() => {
        const eps = info?.episodes ?? [];
        const useGroups = eps.length > CHUNK;
        const parts = useGroups
            ? Array.from({ length: Math.ceil(eps.length / CHUNK) }, (_, i) => ({
                label: `Part ${i + 1} (EP ${i * CHUNK + 1}–${Math.min((i + 1) * CHUNK, eps.length)})`,
                episodes: eps.slice(i * CHUNK, (i + 1) * CHUNK),
            }))
            : [{ label: 'All Episodes', episodes: eps }];
        return { parts, visibleEps: parts[selectedPart]?.episodes ?? [] };
    }, [info?.episodes, selectedPart]);

    if (loading) return <LoadingAnimation />;

    if (!info) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
            <p className="text-zinc-400 text-sm">Failed to load anime info.</p>
            <p className="text-zinc-600 text-xs">The metadata service may be temporarily unavailable.</p>
            <button
                onClick={() => fetchInfo(isDub, true)}
                className="mt-2 bg-white text-black text-sm px-4 py-2 rounded hover:bg-gray-200 transition"
            >
                Retry
            </button>
            <button
                onClick={() => router.push('/anime')}
                className="text-zinc-500 text-xs hover:text-zinc-300 transition"
            >
                ← Back to Anime
            </button>
        </div>
    );

    const title = info.title.english || info.title.romaji;

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            {/* Banner */}
            {info.cover && (
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                    <img src={info.cover} alt={title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
            )}

            <div className={`px-4 md:px-12 pb-16 ${info.cover ? '-mt-24 relative' : 'pt-28'}`}>
                <button
                    onClick={() => router.push('/anime')}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition mb-5 text-sm"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Anime
                </button>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Poster */}
                    <div className="shrink-0">
                        <img src={info.image} alt={title} className="w-36 md:w-48 rounded-xl shadow-2xl" />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 pt-2">
                        <h1 className="text-white text-2xl md:text-3xl font-bold">{title}</h1>
                        {info.title.romaji !== title && (
                            <p className="text-zinc-400 text-sm mt-1">{info.title.romaji}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-zinc-400">
                            {info.rating && <span className="text-yellow-400 font-semibold">★ {(info.rating / 10).toFixed(1)}</span>}
                            {info.releaseDate && <span>{info.releaseDate}</span>}
                            {info.status && <span className="bg-zinc-800 px-2 py-0.5 rounded">{info.status}</span>}
                            {info.type && <span className="bg-zinc-800 px-2 py-0.5 rounded">{info.type}</span>}
                            {info.totalEpisodes && <span>{info.totalEpisodes} episodes</span>}
                        </div>

                        {info.genres && info.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {info.genres.map(g => (
                                    <span key={g} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">{g}</span>
                                ))}
                            </div>
                        )}

                        {info.description && (
                            <p
                                className="text-zinc-400 text-sm mt-4 leading-relaxed max-w-2xl line-clamp-4"
                                dangerouslySetInnerHTML={{ __html: info.description }}
                            />
                        )}

                        {/* Sub / Dub toggle */}
                        <div className="flex items-center gap-2 mt-5">
                            {(['SUB', 'DUB'] as const).map(type => {
                                const active = type === 'DUB' ? isDub : !isDub;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleDubToggle(type === 'DUB')}
                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${active ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                            {dubLoading && (
                                <div className="relative w-5 h-5">
                                    <div className="absolute inset-0 border-2 border-blue-800/30 rounded-full" />
                                    <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seasons */}
                {seasons.length > 1 && (
                    <div className="mt-8">
                        <h2 className="text-white text-lg font-bold mb-3">Seasons</h2>
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                            {seasons.map((season, i) => (
                                <button
                                    key={season.id}
                                    onClick={() => season.id !== parseInt(animeId) && router.push(`/anime/${season.id}`)}
                                    className={`shrink-0 flex flex-col items-center gap-2 rounded-xl overflow-hidden border-2 transition w-28 ${i === currentSeasonIndex
                                            ? 'border-blue-500'
                                            : 'border-zinc-700 hover:border-zinc-500 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className="w-full h-16 bg-zinc-800 overflow-hidden">
                                        {season.image && (
                                            <img src={season.image} alt={season.title} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="px-2 pb-2 text-center">
                                        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{season.title}</p>
                                        {season.episodes && (
                                            <p className="text-zinc-500 text-[10px] mt-0.5">{season.episodes} eps</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Episodes */}
                <div className="mt-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h2 className="text-white text-xl font-bold">
                            Episodes {isDub ? '(Dub)' : '(Sub)'} — {info.episodes.length} available
                        </h2>
                        {parts.length > 1 && (
                            <select
                                value={selectedPart}
                                onChange={e => setSelectedPart(parseInt(e.target.value))}
                                className="bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg border border-zinc-700 outline-none focus:border-zinc-500 cursor-pointer"
                            >
                                {parts.map((p, i) => (
                                    <option key={i} value={i}>{p.label}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {visibleEps.map(ep => (
                            <button
                                key={ep.id}
                                onClick={() => handleWatch(ep)}
                                className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-3 text-left transition group"
                            >
                                <div className="relative shrink-0 w-24 h-14 rounded overflow-hidden bg-zinc-800">
                                    {ep.image
                                        ? <img src={ep.image} alt={`Episode ${ep.number}`} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">EP {ep.number}</div>
                                    }
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <PlayIcon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">Episode {ep.number}</p>
                                    {ep.title && <p className="text-zinc-400 text-xs truncate mt-0.5">{ep.title}</p>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
