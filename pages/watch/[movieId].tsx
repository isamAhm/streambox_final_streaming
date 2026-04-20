import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import useMovie from '@/hooks/useMovie';
import { streamingService, StreamingSource } from '@/libs/streaming';
import axios from 'axios';
import { mutate } from 'swr';

interface EpisodeDetail {
  number: number;
  name: string;
  thumbnail: string | null;
}

interface SeasonInfo {
  number: number;
  name: string;
  episodeCount: number;
}

const Watch = () => {
  const router = useRouter();
  const { movieId, season: seasonQuery, ep: epQuery } = router.query;
  const { data } = useMovie(movieId as string);

  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Season/episode state
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEp, setCurrentEp] = useState(1);

  // Episodes drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [drawerSeason, setDrawerSeason] = useState(1);
  const [episodes, setEpisodes] = useState<EpisodeDetail[]>([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const activeEpRef = useRef<HTMLButtonElement>(null);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchStartTimeRef = useRef<number>(Date.now());

  const isTV = data?.type === 'tv';

  // Init season/ep from query params
  useEffect(() => {
    if (seasonQuery) setCurrentSeason(parseInt(seasonQuery as string) || 1);
    if (epQuery) setCurrentEp(parseInt(epQuery as string) || 1);
  }, [seasonQuery, epQuery]);

  // Track watch progress
  useEffect(() => {
    if (!movieId || typeof movieId !== 'string') return;
    axios.post('/api/watch-history/update', { movieId, progress: 0 })
      .then(() => mutate('/api/watch-history'))
      .catch(() => { });
    watchStartTimeRef.current = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const watchDuration = (Date.now() - watchStartTimeRef.current) / 1000;
      const estimatedProgress = Math.min((watchDuration / 7200) * 100, 95);
      axios.post('/api/watch-history/update', { movieId, progress: estimatedProgress }).catch(() => { });
    }, 30000);
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [movieId]);

  // Build streaming sources
  useEffect(() => {
    if (!data?.imdbId) return;
    try {
      const streamSources = isTV
        ? streamingService.getTVShowStreamSources(data.imdbId, currentSeason, currentEp, data.tmdbId)
        : streamingService.getMovieStreamSources(data.imdbId, data.tmdbId);
      setSources(streamSources);
      setCurrentSourceIndex(0);
    } catch { setSources([]); }
    setIsLoading(false);
  }, [data, currentSeason, currentEp, isTV]);

  // Load seasons when drawer opens (TV only)
  useEffect(() => {
    if (!drawerOpen || !isTV || !data?.tmdbId || seasons.length > 0) return;
    fetch(`/api/movies/details/${movieId}`)
      .then(r => r.json())
      .then(d => {
        const s: SeasonInfo[] = (d.seasons || []).map((s: any) => ({
          number: s.number,
          name: s.name,
          episodeCount: s.episodeCount,
        }));
        setSeasons(s);
        setDrawerSeason(currentSeason);
      })
      .catch(() => { });
  }, [drawerOpen, isTV, data?.tmdbId, movieId]);

  // Load episodes whenever drawerSeason changes (or drawer first opens)
  useEffect(() => {
    if (!isTV || !data?.tmdbId) return;
    setEpsLoading(true);
    setEpisodes([]);
    fetch(`/api/anime/episodes/${data.tmdbId}?season=${drawerSeason}`)
      .then(r => r.json())
      .then(d => setEpisodes(d.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setEpsLoading(false));
  }, [drawerSeason, isTV, data?.tmdbId]);

  // Scroll active episode into view
  useEffect(() => {
    if (drawerOpen && activeEpRef.current) {
      setTimeout(() => activeEpRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
    }
  }, [drawerOpen, episodes]);

  const handleEpisodeClick = (season: number, ep: number) => {
    setDrawerOpen(false);
    setCurrentSeason(season);
    setCurrentEp(ep);
    router.replace(`/watch/${movieId}?season=${season}&ep=${ep}`, undefined, { shallow: true });
  };

  if (!data || isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  const currentSource = sources[currentSourceIndex];

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Back */}
      <button onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-gray-700/50 hover:border-gray-600">
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="text-sm font-medium hidden md:inline">Back</span>
      </button>

      {/* Top right controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Episodes button — TV only */}
        {isTV && (
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-sm px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all backdrop-blur-sm">
            <ListBulletIcon className="w-4 h-4" />
            <span className="hidden md:inline">Episodes</span>
          </button>
        )}

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
      {currentSource && (
        <iframe key={currentSource.url} src={currentSource.url}
          className="w-full h-full" allowFullScreen frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin" title={data.title}
        />
      )}

      {/* Episodes Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="w-80 max-w-full bg-zinc-900 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <div>
                <p className="text-white text-sm font-semibold">Episodes</p>
                <p className="text-zinc-500 text-xs truncate max-w-[200px]">{data.title}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-zinc-400 hover:text-white transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Season tabs */}
            {seasons.length > 1 && (
              <div className="flex gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto scrollbar-hide shrink-0">
                {seasons.map(s => (
                  <button key={s.number} onClick={() => setDrawerSeason(s.number)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${drawerSeason === s.number ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                    S{s.number}
                  </button>
                ))}
              </div>
            )}

            {/* Episode list */}
            <div className="flex-1 overflow-y-auto scrollbar-modern p-3">
              {epsLoading && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-blue-800/30 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
              {!epsLoading && episodes.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-12">No episodes found</p>
              )}
              {!epsLoading && episodes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {episodes.map(ep => {
                    const isActive = drawerSeason === currentSeason && ep.number === currentEp;
                    return (
                      <button key={ep.number}
                        ref={isActive ? activeEpRef : undefined}
                        onClick={() => handleEpisodeClick(drawerSeason, ep.number)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition text-left ${isActive ? 'bg-blue-600/20 border border-blue-600' : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'}`}>
                        <div className="relative shrink-0 w-20 h-12 rounded overflow-hidden bg-zinc-700">
                          {ep.thumbnail
                            ? <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><PlayIcon className="w-4 h-4 text-zinc-500" /></div>
                          }
                          {isActive && (
                            <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                              <PlayIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">EP {ep.number}</p>
                          <p className="text-white text-xs font-medium truncate mt-0.5">{ep.name || `Episode ${ep.number}`}</p>
                        </div>
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
};

export default Watch;
