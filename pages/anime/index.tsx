import React, { useEffect, useState, useCallback, useRef } from 'react'; import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { MagnifyingGlassIcon, PlayIcon, InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AnimeSchedule from '@/components/Anime/AnimeSchedule';
import AnimeList from '@/components/Anime/AnimeList';
import { LoadingAnimation } from '@/components/loading-animation';

interface AnimeResult {
    id: string;
    title: { romaji: string; english: string | null; native: string };
    image: string;
    cover?: string;
    rating?: number;
    releaseDate?: number;
    totalEpisodes?: number;
    status?: string;
    type?: string;
    description?: string;
    genres?: string[];
}

// ─── Spotlight Slideshow ────────────────────────────────────────────────────
function Spotlight({ items }: { items: AnimeResult[] }) {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [transitioning, setTransitioning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();
    const slides = items.slice(0, 8); // top 8 for spotlight

    const goTo = useCallback((index: number) => {
        if (transitioning) return;
        setTransitioning(true);
        setTimeout(() => {
            setCurrent(index);
            setTransitioning(false);
        }, 300);
    }, [transitioning]);

    const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);
    const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo]);

    // Auto-advance every 6s
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

    return (
        <div className="relative w-full h-[70vh] min-h-[480px] overflow-hidden bg-black pt-16">
            {/* Background cover image */}
            {slides.map((item, i) => (
                <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img
                        src={item.cover || item.image}
                        alt=""
                        className="w-full h-full object-cover object-top"
                    />
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
                </div>
            ))}

            {/* Content */}
            <div className={`top-4 absolute inset-0 flex items-end pb-16 px-6 md:px-14 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
                <div className="max-w-xl">
                    {/* Rank badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">
                            #{current + 1} Spotlight
                        </span>
                        {anime.type && (
                            <span className="text-xs text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-full">{anime.type}</span>
                        )}
                    </div>

                    <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
                        {title}
                    </h1>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-3 text-sm text-zinc-300">
                        {anime.rating && (
                            <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                ★ {(anime.rating / 10).toFixed(1)}
                            </span>
                        )}
                        {anime.releaseDate && <span>{anime.releaseDate}</span>}
                        {anime.totalEpisodes && <span>{anime.totalEpisodes} Episodes</span>}
                    </div>

                    {/* Genres */}
                    {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {anime.genres.slice(0, 4).map((g) => (
                                <span key={g} className="text-xs text-zinc-300 border border-zinc-600 px-2 py-0.5 rounded-full">
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    {anime.description && (
                        <p
                            className="text-zinc-400 text-sm mt-3 line-clamp-2 leading-relaxed max-w-lg"
                            dangerouslySetInnerHTML={{ __html: anime.description.replace(/<[^>]*>/g, '').slice(0, 120) + (anime.description.replace(/<[^>]*>/g, '').length > 120 ? '...' : '') }}
                        />
                    )}

                    {/* Buttons */}
                    <div className="flex items-center gap-3 mt-5">
                        <button
                            onClick={() => router.push(`/anime/${anime.id}`)}
                            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black font-bold px-5 py-2.5 rounded-lg transition text-sm"
                        >
                            <PlayIcon className="w-4 h-4" />
                            Watch Now
                        </button>
                        <button
                            onClick={() => router.push(`/anime/${anime.id}`)}
                            className="flex items-center gap-2 bg-zinc-700/80 hover:bg-zinc-600/80 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm backdrop-blur-sm"
                        >
                            <InformationCircleIcon className="w-4 h-4" />
                            Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Prev / Next arrows */}
            <button
                onClick={() => { prev(); resetTimer(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition backdrop-blur-sm z-10"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => { next(); resetTimer(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition backdrop-blur-sm z-10"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { goTo(i); resetTimer(); }}
                        className={`rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`}
                    />
                ))}
            </div>

        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AnimePage() {
    const router = useRouter();
    const [trending, setTrending] = useState<AnimeResult[]>([]);
    const [popular, setPopular] = useState<AnimeResult[]>([]);
    const [movies, setMovies] = useState<AnimeResult[]>([]);
    const [series, setSeries] = useState<AnimeResult[]>([]);
    const [upcoming, setUpcoming] = useState<AnimeResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AnimeResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    // Handle ?q= from navbar search
    useEffect(() => {
        const q = router.query.q as string;
        if (q) {
            setSearchQuery(q);
            setSearching(true);
            axios.get(`/api/anime/search?q=${encodeURIComponent(q)}`)
                .then((r) => setSearchResults(r.data.results || []))
                .catch(() => setSearchResults([]))
                .finally(() => setSearching(false));
        }
    }, [router.query.q]);

    useEffect(() => {
        axios.get('/api/anime/home')
            .then((r) => {
                setTrending(r.data.trending || []);
                setPopular(r.data.popular || []);
                setMovies(r.data.movies || []);
                setSeries(r.data.series || []);
                setUpcoming(r.data.upcoming || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await axios.get(`/api/anime/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data.results || []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const goToAnime = (id: string) => router.push(`/anime/${id}`);

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            {loading ? (
                <LoadingAnimation />
            ) : searchResults.length > 0 || searching ? (
                <div className="pt-28 pb-16 px-4 md:px-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white text-xl font-bold">
                            {searching ? 'Searching...' : `Results for "${searchQuery}"`}
                        </h2>
                        <button onClick={() => { setSearchResults([]); setSearchQuery(''); }} className="text-zinc-400 hover:text-white text-sm transition">
                            ← Back
                        </button>
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
                            {searchResults.map((anime) => {
                                const label = anime.title.english || anime.title.romaji;
                                return (
                                    <div
                                        key={anime.id}
                                        onClick={() => router.push(`/anime/${anime.id}`)}
                                        className="group relative w-full cursor-pointer"
                                    >
                                        {/* Poster */}
                                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-800">
                                            <img
                                                src={anime.image}
                                                alt={label}
                                                draggable={false}
                                                className="object-cover w-full h-full transition-all duration-300 md:group-hover:scale-105 md:group-hover:brightness-75"
                                            />
                                            {/* Hover overlay */}
                                            <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                                                        <svg className="w-7 h-7 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                    <h3 className="text-white font-semibold text-xs line-clamp-2 mb-1">{label}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        {anime.releaseDate && <span className="text-gray-300">{anime.releaseDate}</span>}
                                                        {anime.rating && <span className="text-yellow-400">★ {(anime.rating / 10).toFixed(1)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Title below — fades on hover */}
                                        <div className="mt-2 md:group-hover:opacity-0 transition-opacity duration-300">
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
                <>
                    {/* Spotlight slideshow — no top padding, sits under transparent navbar */}
                    <Spotlight items={trending} />

                    {/* Search bar below spotlight */}
                    {/* <div className="px-4 md:px-12 py-6 flex justify-end">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search anime..."
                                className="bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none focus:ring-1 focus:ring-white text-sm placeholder-zinc-500 w-56"
                            />
                            <button type="submit" className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition">
                                <MagnifyingGlassIcon className="w-4 h-4" />
                            </button>
                        </form>
                    </div> */}

                    {/* Rows */}
                    <AnimeList data={trending} title="🔥 Trending Now" />
                    <AnimeList data={popular} title="⭐ Popular" />
                    <AnimeList data={movies} title="🎬 Anime Movies" />
                    <AnimeList data={series} title="📺 Anime Series" />
                    <AnimeList data={upcoming} title="🗓️ Coming Soon" />
                    <AnimeSchedule />
                </>
            )}
        </div>
    );
}
