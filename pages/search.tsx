import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import Navbar from '@/components/Navbar';
import SearchMovieCard from '@/components/SearchMovieCard';
import SearchMovieCardSkeleton from '@/components/SearchMovieCardSkeleton';
import InfoModal from '@/components/InfoModal';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import axios from 'axios';

export async function getServerSideProps(context: NextPageContext) {
    const { userId } = getAuth(context.req as any);

    if (!userId) {
        return {
            redirect: {
                destination: '/auth',
                permanent: false,
            }
        }
    }

    return {
        props: {}
    }
}

interface SearchResult {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    genre: string;
    duration: string;
    videoUrl: string;
    imdbId: string;
    tmdbId?: number;
    year?: number;
    rating?: number;
    type: string;
}

const Search = () => {
    const router = useRouter();
    const { q } = router.query;
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [showSkeletons, setShowSkeletons] = useState(false);
    const [pollCount, setPollCount] = useState(0);
    const { isOpen, closeModal } = useInfoModalStore();
    const abortControllerRef = React.useRef<AbortController | null>(null);

    useEffect(() => {
        if (q && typeof q === 'string') {
            setSearchQuery(q);
            performSearch(q);
        }
    }, [q]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Poll for new results while enriching
    useEffect(() => {
        if (!isEnriching || !q || typeof q !== 'string') return;

        // Poll every 2 seconds, max 5 times (10 seconds total)
        if (pollCount >= 5) {
            setIsEnriching(false);
            setShowSkeletons(false);
            return;
        }

        const pollTimer = setTimeout(() => {
            pollForNewResults(q);
        }, 2000);

        return () => clearTimeout(pollTimer);
    }, [isEnriching, pollCount, q]);

    const pollForNewResults = async (query: string) => {
        try {
            const response = await axios.get(`/api/movies/search?query=${encodeURIComponent(query)}&type=all`, {
                signal: abortControllerRef.current?.signal
            });
            const newResults = response.data.results || [];

            // Only update if we got more results
            if (newResults.length > results.length) {
                setResults(newResults);
                console.log(`📊 Polled: Found ${newResults.length - results.length} new results`);
            }

            setPollCount(prev => prev + 1);

            // Check if still enriching
            if (!response.data.enriching) {
                setIsEnriching(false);
                setShowSkeletons(false);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Poll request cancelled');
                return;
            }
            console.error('Poll error:', error);
            setPollCount(prev => prev + 1);
        }
    };

    const performSearch = async (query: string) => {
        if (!query.trim()) return;

        // Cancel any ongoing requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this search
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setHasSearched(true);
        setPollCount(0);
        setIsEnriching(false);
        setShowSkeletons(false);

        try {
            const response = await axios.get(`/api/movies/search?query=${encodeURIComponent(query)}&type=all`, {
                signal: abortControllerRef.current.signal
            });
            setResults(response.data.results || []);

            // Check if background enrichment is happening
            if (response.data.enriching) {
                setIsEnriching(true);
                setShowSkeletons(true);
                console.log('🔄 Background enrichment active, polling for new results...');
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Search request cancelled');
                return;
            }
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <InfoModal visible={isOpen} onClose={closeModal} />
            <Navbar />

            <div className="pt-24 px-4 md:px-12">
                {/* Search Bar */}
                <div className="max-w-4xl mx-auto mb-8">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for movies and TV shows..."
                            className="w-full px-6 py-4 bg-transparent text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-lg"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Results */}
                {!isLoading && hasSearched && (
                    <>
                        {results.length > 0 || showSkeletons ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-white text-2xl md:text-3xl font-semibold">
                                        Search Results for &quot;{q}&quot;
                                    </h2>
                                    {isEnriching && (
                                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
                                            <span>Loading more results...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 pb-8">
                                    {results.map((result) => (
                                        <SearchMovieCard
                                            key={result.id}
                                            data={{
                                                id: result.id,
                                                title: result.title,
                                                thumbnailUrl: result.thumbnailUrl,
                                                genre: result.genre,
                                                duration: result.duration,
                                                description: result.description,
                                                videoUrl: result.videoUrl,
                                                year: result.year?.toString() || '',
                                            }}
                                        />
                                    ))}
                                    {/* Show skeleton loaders while enriching */}
                                    {showSkeletons && Array.from({ length: 6 }).map((_, index) => (
                                        <SearchMovieCardSkeleton key={`skeleton-${index}`} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-xl mb-4">No results found for &quot;{q}&quot;</p>
                                <p className="text-gray-500">Try searching with different keywords</p>
                            </div>
                        )}
                    </>
                )}

                {/* Initial State */}
                {!hasSearched && !isLoading && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl">Search for your favorite movies and TV shows</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
