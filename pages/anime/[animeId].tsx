import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LoadingAnimation } from '@/components/loading-animation';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';

interface Season {
    number: number;
    name: string;
    episodeCount: number;
    airDate: string;
    posterUrl: string | null;
    overview: string;
    tmdbSeasonNumber: number; // actual TMDB season (1 for virtual splits)
    episodeOffset: number;    // cumulative ep offset within TMDB season
}

interface AnimeInfo {
    tmdbId: number;
    imdbId: string | null;
    title: string;
    originalTitle: string;
    description: string;
    image: string | null;
    backdropUrl: string | null;
    rating: number;
    status: string;
    genres: string[];
    releaseDate: string;
    totalEpisodes: number;
    totalSeasons: number;
    seasons: Season[];
}

const CHUNK = 50;

export default function AnimeDetailPage() {
    const router = useRouter();
    const { animeId, dub: dubQuery } = router.query as { animeId: string; dub?: string };

    const [info, setInfo] = useState<AnimeInfo | null>(null);
    const [isDub, setIsDub] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedPart, setSelectedPart] = useState(0);
    const [episodeCount, setEpisodeCount] = useState(0);
    const [episodeDetails, setEpisodeDetails] = useState<Record<number, { name: string; thumbnail: string | null }>>({});
    const [epsDetailLoading, setEpsDetailLoading] = useState(false);

    useEffect(() => {
        if (!router.isReady || !animeId) return;
        const startAsDub = dubQuery === 'true';
        setIsDub(startAsDub);
        setLoading(true);

        axios.get(`/api/anime/tmdb-info/${animeId}`)
            .then(r => {
                setInfo(r.data);
                setSelectedSeason(1);
                setEpisodeCount(r.data.seasons?.[0]?.episodeCount || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router.isReady, animeId]);

    // Fetch episode thumbnails + names from TMDB for the selected season
    useEffect(() => {
        if (!info) return;
        const season = info.seasons.find(s => s.number === selectedSeason);
        if (!season) return;
        const tmdbSeason = season.tmdbSeasonNumber;
        setEpsDetailLoading(true);
        setEpisodeDetails({});
        axios.get(`/api/anime/episodes/${info.tmdbId}?season=${tmdbSeason}`)
            .then(r => {
                const map: Record<number, { name: string; thumbnail: string | null }> = {};
                (r.data.episodes || []).forEach((ep: any) => {
                    // Map TMDB ep number back to virtual ep number using offset
                    const virtualEp = ep.number - season.episodeOffset;
                    if (virtualEp >= 1 && virtualEp <= season.episodeCount) {
                        map[virtualEp] = { name: ep.name, thumbnail: ep.thumbnail };
                    }
                });
                setEpisodeDetails(map);
            })
            .catch(() => setEpisodeDetails({}))
            .finally(() => setEpsDetailLoading(false));
    }, [info, selectedSeason]);

    const handleSeasonChange = (seasonNum: number) => {
        setSelectedSeason(seasonNum);
        setSelectedPart(0);
        const season = info?.seasons.find(s => s.number === seasonNum);
        setEpisodeCount(season?.episodeCount || 0);
        setEpisodeDetails({});
    };

    const handleWatch = (epNumber: number) => {
        if (!info) return;
        const season = info.seasons.find(s => s.number === selectedSeason);
        // For virtual seasons (AniList split), map ep back to TMDB's actual season+episode
        const tmdbSeason = season?.tmdbSeasonNumber ?? selectedSeason;
        const tmdbEp = (season?.episodeOffset ?? 0) + epNumber;

        const titleParam = encodeURIComponent(info.title);
        const params = new URLSearchParams({
            animeId: String(info.tmdbId),
            ep: String(tmdbEp),
            season: String(tmdbSeason),
            dub: String(isDub),
            title: titleParam,
            tmdbId: String(info.tmdbId),
            // Pass display season/ep so the watch page can show the right label
            displaySeason: String(selectedSeason),
            displayEp: String(epNumber),
            ...(info.imdbId && { imdbId: info.imdbId }),
        });
        router.push(`/anime/watch/s${tmdbSeason}e${tmdbEp}?${params}`);
    };

    // Episode pagination
    const { parts, visibleEps } = useMemo(() => {
        const eps = Array.from({ length: episodeCount }, (_, i) => i + 1);
        const useGroups = eps.length > CHUNK;
        const parts = useGroups
            ? Array.from({ length: Math.ceil(eps.length / CHUNK) }, (_, i) => ({
                label: `EP ${i * CHUNK + 1}–${Math.min((i + 1) * CHUNK, eps.length)}`,
                episodes: eps.slice(i * CHUNK, (i + 1) * CHUNK),
            }))
            : [{ label: 'All', episodes: eps }];
        return { parts, visibleEps: parts[selectedPart]?.episodes ?? [] };
    }, [episodeCount, selectedPart]);

    if (loading) return <LoadingAnimation />;

    if (!info) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
            <p className="text-zinc-400 text-sm">Failed to load anime info.</p>
            <button onClick={() => router.push('/anime')} className="text-zinc-500 text-xs hover:text-zinc-300 transition">
                ← Back to Anime
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            {/* Banner */}
            {info.backdropUrl && (
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                    <img src={info.backdropUrl} alt={info.title} className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
            )}

            <div className={`px-4 md:px-12 pb-16 ${info.backdropUrl ? '-mt-24 relative' : 'pt-28'}`}>
                <button onClick={() => router.push('/anime')}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition mb-5 text-sm">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Anime
                </button>

                <div className="flex flex-col md:flex-row gap-6">
                    {info.image && (
                        <div className="shrink-0">
                            <img src={info.image} alt={info.title} className="w-36 md:w-48 rounded-xl shadow-2xl" />
                        </div>
                    )}

                    <div className="flex-1 pt-2">
                        <h1 className="text-white text-2xl md:text-3xl font-bold">{info.title}</h1>
                        {info.originalTitle !== info.title && (
                            <p className="text-zinc-400 text-sm mt-1">{info.originalTitle}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-zinc-400">
                            {info.rating > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                    <StarIcon className="w-4 h-4" /> {info.rating.toFixed(1)}
                                </span>
                            )}
                            {info.releaseDate && <span>{info.releaseDate.slice(0, 4)}</span>}
                            {info.status && <span className="bg-zinc-800 px-2 py-0.5 rounded">{info.status}</span>}
                            {info.totalSeasons > 0 && <span>{info.totalSeasons} season{info.totalSeasons > 1 ? 's' : ''}</span>}
                        </div>

                        {info.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {info.genres.map(g => (
                                    <span key={g} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">{g}</span>
                                ))}
                            </div>
                        )}

                        {info.description && (
                            <p className="text-zinc-400 text-sm mt-4 leading-relaxed max-w-2xl line-clamp-4">{info.description}</p>
                        )}

                        {/* Sub/Dub toggle — coming soon */}
                        <div className="flex items-center gap-2 mt-5">
                            {(['SUB', 'DUB'] as const).map(type => (
                                <div key={type} className="relative group">
                                    <button
                                        disabled
                                        className="px-4 py-1.5 rounded-full text-sm font-semibold cursor-not-allowed opacity-40 bg-zinc-800 text-zinc-500 select-none"
                                    >
                                        {type}
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-zinc-700 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        Coming soon
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Season selector — always visible */}
                {info.seasons.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-white text-lg font-bold mb-3">
                            Season{info.seasons.length > 1 ? 's' : ''}
                        </h2>
                        <div
                            className="flex gap-2 overflow-x-scroll pb-2"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {info.seasons.map(season => {
                                const isActive = selectedSeason === season.number;
                                return (
                                    <button
                                        key={season.number}
                                        onClick={() => handleSeasonChange(season.number)}
                                        className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive
                                            ? 'border-blue-500 bg-blue-500/10 text-white'
                                            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        {season.posterUrl && (
                                            <img
                                                src={season.posterUrl}
                                                alt={season.name}
                                                className="w-8 h-12 object-cover rounded shrink-0"
                                            />
                                        )}
                                        <div className="text-left">
                                            <p className={`text-sm font-semibold ${isActive ? 'text-white' : ''}`}>
                                                {season.name}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{season.episodeCount} episodes</p>
                                        </div>
                                        {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-1 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Episodes */}
                <div className="mt-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h2 className="text-white text-xl font-bold">
                            Episodes — {episodeCount} available
                        </h2>
                        {parts.length > 1 && (
                            <select value={selectedPart} onChange={e => setSelectedPart(parseInt(e.target.value))}
                                className="bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg border border-zinc-700 outline-none cursor-pointer">
                                {parts.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {visibleEps.map(epNum => {
                            const detail = episodeDetails[epNum];
                            return (
                                <button key={epNum} onClick={() => handleWatch(epNum)}
                                    className="group flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg p-2 transition text-left">
                                    {/* Thumbnail */}
                                    <div className="relative shrink-0 w-24 h-14 rounded overflow-hidden bg-zinc-800">
                                        {detail?.thumbnail ? (
                                            <img src={detail.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {epsDetailLoading
                                                    ? <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                                                    : <PlayIcon className="w-5 h-5 text-zinc-700" />
                                                }
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <PlayIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold truncate">Episode {epNum}</p>
                                        <p className="text-zinc-500 text-xs truncate mt-0.5">
                                            {detail?.name && detail.name !== `Episode ${epNum}` ? detail.name : ''}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
