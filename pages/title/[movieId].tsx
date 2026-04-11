import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import { ArrowLeftIcon, StarIcon, PlayIcon } from '@heroicons/react/24/solid';
import { ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import WatchlistButton from '@/components/WatchlistButton';

interface CastMember { id: number; name: string; character: string; profileUrl: string | null; }
interface CrewMember { id: number; name: string; job: string; }
interface Season { number: number; name: string; episodeCount: number; airDate: string; posterUrl: string | null; overview: string; }
interface Similar { tmdbId: number; title: string; posterUrl: string | null; rating: number; year: string; }
interface Trailer { key: string; name: string; type: string; embedUrl: string; }
interface Movie { id: string; title: string; description: string; thumbnailUrl: string; backdropUrl?: string; genre: string; duration: string; year: number; rating: number; type: string; imdbId: string; }

interface DetailData {
    movie: Movie;
    cast: CastMember[];
    crew: CrewMember[];
    seasons: Season[];
    similar: Similar[];
    trailers: Trailer[];
}

export default function TitleDetailPage() {
    const router = useRouter();
    const { movieId } = router.query as { movieId: string };

    const [data, setData] = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'cast' | 'seasons' | 'similar'>('cast');

    useEffect(() => {
        if (!movieId) return;
        setLoading(true);
        // window.scrollTo({ top: 0, behavior: 'instant' });
        axios.get(`/api/movies/details/${movieId}`)
            .then(r => {
                setData(r.data);
                // Scroll to top after data loads to prevent layout-shift scroll jump
                // window.scrollTo({ top: 0, behavior: 'instant' });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [movieId]);

    const movie = data?.movie;
    const heroImage = movie?.backdropUrl || movie?.thumbnailUrl;

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Head><title>{movie?.title ?? 'Loading...'} — StreamBox</title></Head>
            <Navbar />

            {/* Hero backdrop */}
            <div className="relative w-full h-[50vw] max-h-[520px] overflow-hidden">
                {heroImage && (
                    <>
                        <img
                            src={heroImage}
                            alt={movie?.title}
                            className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />
                    </>
                )}
                {loading && <div className="absolute inset-0 bg-zinc-900 animate-pulse" />}
            </div>

            {/* Main content */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-32 relative z-10 pb-20">
                {/* Back button — sits just above the poster */}
                <button
                    onClick={() => {
                        // window.scrollTo({ top: 0 });
                        // if (window.history.length > 1) {
                        //     router.back();
                        // } else {
                        //     router.push('/');
                        // }
                        router.push('/');
                    }}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition mb-4 backdrop-blur-sm border-r-2 border-t-2 border-blue-800 rounded-md px-1"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Poster */}
                    {movie?.thumbnailUrl && (
                        <div className="shrink-0">
                            <img
                                src={movie.thumbnailUrl}
                                alt={movie.title}
                                className="w-40 md:w-56 rounded-xl shadow-2xl border border-white/10"
                            />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 pt-2">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-10 w-2/3 bg-zinc-800 rounded" />
                                <div className="h-5 w-1/3 bg-zinc-800 rounded" />
                                <div className="h-20 w-full bg-zinc-800 rounded" />
                            </div>
                        ) : movie ? (
                            <>
                                <h1 className="text-3xl md:text-5xl font-bold mb-3">{movie.title}</h1>

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mb-4">
                                    {movie.rating > 0 && (
                                        <span className="flex items-center gap-1 text-yellow-400 font-semibold backdrop-blur-sm rounded px-0.5 bg-zinc-800/80">
                                            <StarIcon className="w-4 h-4" /> {movie.rating.toFixed(1)}
                                        </span>
                                    )}
                                    {movie.year && (
                                        <span className="flex items-center gap-1 backdrop-blur-sm rounded px-0.5 bg-zinc-800/80">
                                            <CalendarIcon className="w-4 h-4" /> {movie.year}
                                        </span>
                                    )}
                                    {movie.duration && (
                                        <span className="flex items-center gap-1 backdrop-blur-sm rounded px-0.5 bg-zinc-800/80">
                                            <ClockIcon className="w-4 h-4" /> {movie.duration}
                                        </span>
                                    )}
                                    <span className="bg-zinc-800 backdrop-blur-md px-2 border border-blue-700 rounded capitalize">{movie.type}</span>
                                </div>

                                {/* Genres */}
                                {movie.genre && (
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {movie.genre.split(',').map(g => (
                                            <span key={g} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
                                                {g.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Description */}
                                <p className="text-zinc-300 leading-relaxed mb-6 max-w-2xl">{movie.description}</p>

                                {/* Crew */}
                                {data?.crew && data.crew.length > 0 && (
                                    <div className="mb-6 text-sm text-zinc-400">
                                        {data.crew.map(c => (
                                            <span key={c.id} className="mr-4">
                                                <span className="text-zinc-500">{c.job}: </span>
                                                <span className="text-white">{c.name}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.push(`/watch/${movie.id}`)}
                                        className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-zinc-200 transition"
                                    >
                                        <PlayIcon className="w-5 h-5" /> Play
                                    </button>
                                    <WatchlistButton movieId={movie.id} movieTitle={movie.title} />
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Tabs */}
                {!loading && data && (
                    <div className="mt-12">

                        {/* Trailers — shown above tabs when available */}
                        {data.trailers && data.trailers.length > 0 && (
                            <div className="mb-10">
                                <h2 className="text-white text-xl font-bold mb-4">Trailers & Clips</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.trailers.map(trailer => (
                                        <div key={trailer.key} className="flex flex-col gap-2">
                                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900">
                                                <iframe
                                                    src={trailer.embedUrl}
                                                    title={trailer.name}
                                                    className="w-full h-full"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    loading="lazy"
                                                />
                                            </div>
                                            <p className="text-zinc-400 text-xs truncate">
                                                <span className="text-zinc-600 mr-1">{trailer.type}</span>
                                                {trailer.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-1 border-b border-zinc-800 mb-8">
                            {(['cast', ...(data.seasons.length > 0 ? ['seasons'] : []), 'similar'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-5 py-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {tab === 'cast' ? `Cast & Crew (${data.cast.length})` : tab === 'seasons' ? `Seasons (${data.seasons.length})` : 'More Like This'}
                                </button>
                            ))}
                        </div>

                        {/* Cast tab */}
                        {activeTab === 'cast' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {data.cast.map(member => (
                                    <div key={member.id} className="flex flex-col items-center text-center gap-2">
                                        <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                            {member.profileUrl
                                                ? <img src={member.profileUrl} alt={member.name} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl font-bold">{member.name[0]}</div>
                                            }
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium leading-tight">{member.name}</p>
                                            <p className="text-zinc-500 text-xs mt-0.5 leading-tight">{member.character}</p>
                                        </div>
                                    </div>
                                ))}
                                {data.cast.length === 0 && <p className="text-zinc-500 col-span-full">No cast information available.</p>}
                            </div>
                        )}

                        {/* Seasons tab */}
                        {activeTab === 'seasons' && (
                            <div className="space-y-4">
                                {data.seasons.map(season => (
                                    <div key={season.number} className="flex gap-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                        {season.posterUrl && (
                                            <img src={season.posterUrl} alt={season.name} className="w-16 rounded-lg shrink-0 object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-white font-semibold">{season.name}</h3>
                                                <span className="text-zinc-500 text-sm">{season.episodeCount} episodes</span>
                                                {season.airDate && <span className="text-zinc-600 text-xs">{season.airDate.slice(0, 4)}</span>}
                                            </div>
                                            {season.overview && <p className="text-zinc-400 text-sm line-clamp-2">{season.overview}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Similar tab */}
                        {activeTab === 'similar' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {data.similar.map(item => (
                                    <div key={item.tmdbId} className="flex flex-col gap-2 cursor-pointer group">
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800">
                                            {item.posterUrl
                                                ? <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                                : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs p-2 text-center">{item.title}</div>
                                            }
                                        </div>
                                        <div>
                                            <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                                                {item.year && <span>{item.year}</span>}
                                                {item.rating > 0 && <span className="text-yellow-500">★ {item.rating.toFixed(1)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {data.similar.length === 0 && <p className="text-zinc-500 col-span-full">No similar titles found.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
