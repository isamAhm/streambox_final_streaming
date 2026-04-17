import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import AnimeList, { AnimeItem } from '@/components/Anime/AnimeList';
import { MagnifyingGlassIcon, PlayIcon, InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingAnimation } from '@/components/loading-animation';

/** Convert TMDB browse item to AnimeItem (matches AnimeList component shape) */
function toAnimeItem(item: any): AnimeItem & { cover?: string; description?: string; genres?: string[] } {
    return {
        id: String(item.tmdbId),
        title: { romaji: item.title, english: item.title, native: item.title },
        image: item.image || '',
        cover: item.backdropUrl || item.image || '',
        rating: item.rating ? item.rating * 10 : undefined,
        releaseDate: item.year ? parseInt(item.year) : undefined,
        type: 'TV',
        description: item.overview || '',
        genres: item.genres || [],
    };
}

// ─── Spotlight Slideshow ────────────────────────────────────────────────────
type SpotlightItem = AnimeItem & { cover?: string; description?: string; genres?: string[] };

function Spotlight({ items }: { items: SpotlightItem[] }) {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [transitioning, setTransitioning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();
    const slides = items.slice(0, 8);

    const goTo = useCallback((index: number) => {
        if (transitioning) return;
        setTransitioning(true);
        setTimeout(() => { setCurrent(index); setTransitioning(false); }, 300);
    }, [transitioning]);

    const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);
    const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo]);

    useEffect(() => {
        timerRef.current = setInterval(next, 6000);
        return () => clearInterval(timerRef.current);
    }, [next]);

    const resetTimer = useCallback(() => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(next, 6000);
    }, [next]);

    if (slides.length === 0) return null;
    const anime = slides[current];
    const title = anime.title.english || anime.title.romaji;

    // Clean description text
    const descText = typeof anime.description === 'string'
        ? anime.description.replace(/<[^>]*(>|$)/g, '')
        : '';
    const truncatedDesc = descText.length > 120 ? descText.slice(0, 120) + '...' : descText;

    return (
        <div className="relative w-full h-[70vh] min-h-[480px] overflow-hidden bg-black pt-16">
            {slides.map((item, i) => (
                <div key={item.id} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
                    <img src={(item as any).cover || item.image} alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
                </div>
            ))}

            <div className={`absolute inset-0 flex items-end pb-16 px-6 md:px-14 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
                <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">
                            #{current + 1} Spotlight
                        </span>
                        {anime.type && <span className="text-xs text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-full">{anime.type}</span>}
                    </div>
                    <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">{title}</h1>
                    <div className="flex items-center gap-3 mt-3 text-sm text-zinc-300">
                        {anime.rating && <span className="flex items-center gap-1 text-yellow-400 font-semibold">★ {(anime.rating / 10).toFixed(1)}</span>}
                        {anime.releaseDate && <span>{anime.releaseDate}</span>}
                        {anime.totalEpisodes && <span>{anime.totalEpisodes} Episodes</span>}
                    </div>
                    {/* Genres */}
                    {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {anime.genres.slice(0, 4).map((g: string) => (
                                <span key={g} className="text-xs text-zinc-300 border border-zinc-600 px-2 py-0.5 rounded-full">
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    {truncatedDesc && (
                        <p className="text-zinc-400 text-sm mt-3 line-clamp-2 leading-relaxed max-w-lg">
                            {truncatedDesc}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-5">
                        <button onClick={() => router.push(`/anime/${anime.id}`)}
                            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black font-bold px-5 py-2.5 rounded-lg transition text-sm">
                            <PlayIcon className="w-4 h-4" /> Watch Now
                        </button>
                        <button onClick={() => router.push(`/anime/${anime.id}`)}
                            className="flex items-center gap-2 bg-zinc-700/80 hover:bg-zinc-600/80 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm backdrop-blur-sm">
                            <InformationCircleIcon className="w-4 h-4" /> Details
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={() => { prev(); resetTimer(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition backdrop-blur-sm z-10">
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={() => { next(); resetTimer(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition backdrop-blur-sm z-10">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {slides.map((_, i) => (
                    <button key={i} onClick={() => { goTo(i); resetTimer(); }}
                        className={`rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`} />
                ))}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AnimePage() {
    const router = useRouter();
    const [trending, setTrending] = useState<SpotlightItem[]>([]);
    const [topRated, setTopRated] = useState<SpotlightItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SpotlightItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Handle ?q= query param
    useEffect(() => {
        const q = router.query.q as string;
        if (q) {
            setSearchQuery(q);
            setSearching(true);
            axios.get(`/api/anime/browse?query=${encodeURIComponent(q)}`)
                .then(r => setSearchResults((r.data.results || []).map(toAnimeItem)))
                .catch(() => setSearchResults([]))
                .finally(() => setSearching(false));
        }
    }, [router.query.q]);

    // Load trending + top rated
    useEffect(() => {
        Promise.all([
            axios.get('/api/anime/browse?sort=popularity.desc&page=1'),
            axios.get('/api/anime/browse?sort=vote_average.desc&page=1'),
        ]).then(([pop, top]) => {
            setTrending((pop.data.results || []).map(toAnimeItem).slice(0, 20));
            setTopRated((top.data.results || []).map(toAnimeItem).slice(0, 20));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await axios.get(`/api/anime/browse?query=${encodeURIComponent(searchQuery)}`);
            setSearchResults((res.data.results || []).map(toAnimeItem));
        } catch { setSearchResults([]); }
        finally { setSearching(false); }
    };

    const clearSearch = () => {
        setSearchResults([]);
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

    const isSearchMode = searchResults.length > 0 || searching;

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            {loading ? <LoadingAnimation /> : (
                <>
                    {!isSearchMode && <Spotlight items={trending} />}

                    {/* Search bar */}
                    {/* <div className={`px-4 md:px-12 ${isSearchMode ? 'pt-28' : 'pt-6'}`}>
                        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-lg">
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search anime..."
                                    className="w-full bg-zinc-800 text-white text-sm pl-9 pr-9 py-2.5 rounded-lg border border-zinc-700 focus:border-zinc-500 focus:outline-none placeholder-zinc-500"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button type="submit"
                                className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2.5 rounded-lg transition font-medium">
                                Search
                            </button>
                        </form>
                    </div> */}

                    {/* Search results */}
                    {isSearchMode ? (
                        <div className="px-4 md:px-12 py-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-white text-xl font-bold">
                                    {searching ? 'Searching...' : `Results for "${searchQuery}"`}
                                </h2>
                                <button onClick={clearSearch}
                                    className="text-zinc-400 hover:text-white text-sm transition">← Back</button>
                            </div>
                            {searching ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-blue-800/30 rounded-full" />
                                        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin" />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                                    {searchResults.map(anime => {
                                        const label = anime.title.english || anime.title.romaji;
                                        return (
                                            <div key={anime.id} onClick={() => router.push(`/anime/${anime.id}`)}
                                                className="group relative w-full cursor-pointer">
                                                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-800">
                                                    <img src={anime.image} alt={label} draggable={false}
                                                        className="object-cover w-full h-full transition-all duration-300 md:group-hover:scale-105 md:group-hover:brightness-75" />
                                                </div>
                                                <div className="mt-2">
                                                    <h3 className="text-white text-xs font-semibold truncate">{label}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                                        {anime.releaseDate && <span>{anime.releaseDate}</span>}
                                                        {anime.rating && <span className="text-yellow-400">★ {(anime.rating / 10).toFixed(1)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Normal browse rows */
                        <div className="pb-16">
                            <AnimeList data={trending} title="🔥 Trending Now" />
                            <AnimeList data={topRated} title="⭐ Top Rated" />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
