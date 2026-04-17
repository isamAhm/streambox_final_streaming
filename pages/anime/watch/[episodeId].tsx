import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ListBulletIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { streamingService, StreamingSource } from '@/libs/streaming';

export default function AnimeWatchPage() {
    const router = useRouter();
    const { animeId, ep, season, title: animeTitle, dub, tmdbId, imdbId, displaySeason, displayEp } = router.query as {
        animeId: string; ep: string; season?: string; title?: string; dub?: string;
        tmdbId?: string; imdbId?: string; displaySeason?: string; displayEp?: string;
    };

    const [sources, setSources] = useState<StreamingSource[]>([]);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Episodes drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [seasonData, setSeasonData] = useState<Array<{ number: number; name: string; episodeCount: number; tmdbSeasonNumber: number; episodeOffset: number }>>([]);
    const [epsLoading, setEpsLoading] = useState(false);
    const activeEpRef = useRef<HTMLButtonElement>(null);

    const title = animeTitle ? decodeURIComponent(animeTitle) : 'Anime';
    const currentEpNum = parseInt(ep) || 1;
    const currentSeason = parseInt(season || '1') || 1;
    // Display labels (virtual season/ep numbers shown to user)
    const displaySeasonNum = parseInt(displaySeason || season || '1') || 1;
    const displayEpNum = parseInt(displayEp || ep || '1') || 1;

    // Build streaming sources
    useEffect(() => {
        if (!router.isReady) return;

        const buildSources = async () => {
            setIsLoading(true);
            setCurrentSourceIndex(0);

            let resolvedTmdbId = tmdbId ? parseInt(tmdbId) : undefined;
            let resolvedImdbId = imdbId;

            // Fetch from TMDB info if not in URL
            if (!resolvedTmdbId && animeId) {
                try {
                    const res = await fetch(`/api/anime/tmdb-info/${animeId}`);
                    if (res.ok) {
                        const data = await res.json();
                        resolvedTmdbId = data.tmdbId;
                        resolvedImdbId = data.imdbId || undefined;
                    }
                } catch { /* non-fatal */ }
            }

            try {
                if (resolvedTmdbId || resolvedImdbId) {
                    const streamSources = streamingService.getAnimeStreamSources(
                        resolvedImdbId || '',
                        currentSeason,
                        currentEpNum,
                        resolvedTmdbId
                    );
                    setSources(streamSources);
                } else {
                    setSources([]);
                }
            } catch {
                setSources([]);
            } finally {
                setIsLoading(false);
            }
        };

        buildSources();
    }, [router.isReady, tmdbId, imdbId, ep, season, animeId]);

    // Load season data for drawer
    useEffect(() => {
        if (!drawerOpen || seasonData.length > 0 || !animeId) return;
        setEpsLoading(true);
        fetch(`/api/anime/tmdb-info/${animeId}`)
            .then(r => r.json())
            .then(d => {
                setSeasonData(d.seasons || []);
            })
            .catch(() => { })
            .finally(() => setEpsLoading(false));
    }, [drawerOpen, animeId]);

    // Active season in drawer = the virtual season matching displaySeasonNum
    const drawerSeason = seasonData.find(s => s.number === displaySeasonNum) || seasonData[0];
    const drawerEpisodeCount = drawerSeason?.episodeCount || 0;

    useEffect(() => {
        if (drawerOpen && activeEpRef.current) {
            setTimeout(() => activeEpRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
        }
    }, [drawerOpen, drawerEpisodeCount]);

    const [drawerSelectedSeason, setDrawerSelectedSeason] = useState<number | null>(null);
    const activeSeason = seasonData.find(s => s.number === (drawerSelectedSeason ?? displaySeasonNum)) || drawerSeason;
    const activeEpisodeCount = activeSeason?.episodeCount || 0;

    const handleEpisodeClick = (epNum: number, targetSeason?: typeof activeSeason) => {
        setDrawerOpen(false);
        const s = targetSeason || activeSeason;
        const tmdbSeason = s?.tmdbSeasonNumber ?? currentSeason;
        const tmdbEp = (s?.episodeOffset ?? 0) + epNum;
        const titleParam = encodeURIComponent(title);
        const params = new URLSearchParams({
            animeId, ep: String(tmdbEp), season: String(tmdbSeason),
            dub: dub || 'false', title: titleParam,
            displaySeason: String(s?.number ?? displaySeasonNum),
            displayEp: String(epNum),
            ...(tmdbId && { tmdbId }),
            ...(imdbId && { imdbId }),
        });
        router.push(`/anime/watch/s${tmdbSeason}e${tmdbEp}?${params}`);
    };

    const currentSource = sources[currentSourceIndex];

    if (isLoading) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!currentSource) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-4">
                <p className="text-white text-lg">Stream not available</p>
                <p className="text-zinc-400 text-sm">No streaming sources found for this episode.</p>
                <button onClick={() => router.push(`/anime/${animeId}?dub=${dub || 'false'}`)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition">
                    ← Back to anime
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-black relative">
            {/* Back button */}
            <button onClick={() => router.push(`/anime/${animeId}?dub=${dub || 'false'}`)}
                className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-gray-700/50 hover:border-gray-600">
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium hidden md:inline">Back</span>
            </button>

            {/* Top right controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <button onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-sm px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all backdrop-blur-sm">
                    <ListBulletIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Episodes</span>
                </button>

                {sources.length > 1 && (
                    <select value={currentSourceIndex} onChange={e => setCurrentSourceIndex(parseInt(e.target.value))}
                        className="bg-black/70 hover:bg-black/90 text-white text-sm px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 focus:outline-none focus:border-blue-500 transition-all backdrop-blur-sm cursor-pointer">
                        {sources.map((source, index) => (
                            <option key={index} value={index}>{source.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Player */}
            <iframe key={currentSource.url} src={currentSource.url}
                className="w-full h-full" allowFullScreen frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="origin" title={`${title} S${displaySeasonNum}E${displayEpNum}`}
            />

            {/* Episodes drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="w-80 max-w-full bg-zinc-900 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                            <div>
                                <p className="text-white text-sm font-semibold">
                                    {activeSeason ? activeSeason.name : `Season ${displaySeasonNum}`} Episodes
                                </p>
                                <p className="text-zinc-500 text-xs truncate max-w-[200px]">{title}</p>
                            </div>
                            <button onClick={() => setDrawerOpen(false)} className="text-zinc-400 hover:text-white transition">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Season tabs (only if multiple seasons) */}
                        {!epsLoading && seasonData.length > 1 && (
                            <div className="flex gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto scrollbar-hide shrink-0">
                                {seasonData.map(s => {
                                    const isActive = s.number === (drawerSelectedSeason ?? displaySeasonNum);
                                    return (
                                        <button key={s.number}
                                            onClick={() => setDrawerSelectedSeason(s.number)}
                                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isActive ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                                            S{s.number}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto scrollbar-modern p-3">
                            {epsLoading && (
                                <div className="flex items-center justify-center py-16">
                                    <div className="relative w-8 h-8">
                                        <div className="absolute inset-0 border-4 border-blue-800/30 rounded-full" />
                                        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin" />
                                    </div>
                                </div>
                            )}
                            {!epsLoading && activeEpisodeCount === 0 && (
                                <p className="text-zinc-500 text-sm text-center py-12">No episodes found</p>
                            )}
                            {!epsLoading && activeEpisodeCount > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: activeEpisodeCount }, (_, i) => i + 1).map(epNum => {
                                        const isCurrentSeason = activeSeason?.number === displaySeasonNum;
                                        const isActive = isCurrentSeason && epNum === displayEpNum;
                                        return (
                                            <button key={epNum}
                                                ref={isActive ? activeEpRef : undefined}
                                                onClick={() => handleEpisodeClick(epNum, activeSeason)}
                                                className={`flex items-center justify-center py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-blue-900/30 hover:text-white'}`}>
                                                {epNum}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
