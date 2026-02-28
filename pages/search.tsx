import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import Navbar from '@/components/Navbar';
import SearchMovieCard from '@/components/SearchMovieCard';
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
    const { isOpen, closeModal } = useInfoModalStore();

    useEffect(() => {
        if (q && typeof q === 'string') {
            setSearchQuery(q);
            performSearch(q);
        }
    }, [q]);

    const performSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await axios.get(`/api/movies/search?query=${encodeURIComponent(query)}&type=all`);
            setResults(response.data.results || []);
        } catch (error) {
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
                        {results.length > 0 ? (
                            <>
                                <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6">
                                    Search Results for "{q}"
                                </h2>
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
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-xl mb-4">No results found for "{q}"</p>
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
