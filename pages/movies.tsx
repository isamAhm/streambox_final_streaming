import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import MovieList from '@/components/MovieList';
import InfoModal from '@/components/InfoModal';
import useMoviesOnly from '@/hooks/useMoviesOnly';
import useMoviesByGenre from '@/hooks/useMoviesByGenre';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import { LoadingAnimation } from '@/components/loading-animation';

const Movies = () => {
    const { data: popularMovies = [], isLoading: isPopularLoading, mutate } = useMoviesOnly();
    const { isOpen, closeModal } = useInfoModalStore();
    const [selectedFilter, setSelectedFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30; // 6 columns x 5 rows = 30 items per page

    // Fetch movies by genre
    const { data: actionMovies = [] } = useMoviesByGenre('Action');
    const { data: adventureMovies = [] } = useMoviesByGenre('Adventure');
    const { data: animationMovies = [] } = useMoviesByGenre('Animation');
    const { data: comedyMovies = [] } = useMoviesByGenre('Comedy');
    const { data: crimeMovies = [] } = useMoviesByGenre('Crime');
    const { data: documentaryMovies = [] } = useMoviesByGenre('Documentary');
    const { data: dramaMovies = [] } = useMoviesByGenre('Drama');
    const { data: familyMovies = [] } = useMoviesByGenre('Family');
    const { data: fantasyMovies = [] } = useMoviesByGenre('Fantasy');
    const { data: horrorMovies = [] } = useMoviesByGenre('Horror');
    const { data: mysteryMovies = [] } = useMoviesByGenre('Mystery');
    const { data: romanceMovies = [] } = useMoviesByGenre('Romance');
    const { data: scifiMovies = [] } = useMoviesByGenre('Science Fiction');
    const { data: thrillerMovies = [] } = useMoviesByGenre('Thriller');

    const filters = [
        'All',
        'Most popular',
        'Most rating',
        'Most recent',
        'Action',
        'Adventure',
        'Animation',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Family',
        'Fantasy',
        'Horror',
        'Mystery',
        'Romance',
        'Sci-Fi',
        'Thriller'
    ];

    // Reset to page 1 when filter changes
    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    // Get filtered content based on selected filter
    const getFilteredContent = () => {
        switch (selectedFilter) {
            case 'All':
                return [
                    { title: 'Most Popular', data: popularMovies },
                    { title: 'Action', data: actionMovies },
                    { title: 'Adventure', data: adventureMovies },
                    { title: 'Animation', data: animationMovies },
                    { title: 'Comedy', data: comedyMovies },
                    { title: 'Crime', data: crimeMovies },
                    { title: 'Documentary', data: documentaryMovies },
                    { title: 'Drama', data: dramaMovies },
                    { title: 'Family', data: familyMovies },
                    { title: 'Fantasy', data: fantasyMovies },
                    { title: 'Horror', data: horrorMovies },
                    { title: 'Mystery', data: mysteryMovies },
                    { title: 'Romance', data: romanceMovies },
                    { title: 'Sci-Fi', data: scifiMovies },
                    { title: 'Thriller', data: thrillerMovies },
                ];
            case 'Most popular':
                return [{ title: 'Most Popular', data: popularMovies }];
            case 'Most rating':
                const sortedByRating = [...popularMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
                return [{ title: 'Top Rated Movies', data: sortedByRating }];
            case 'Most recent':
                const sortedByYear = [...popularMovies].sort((a, b) => (b.year || 0) - (a.year || 0));
                return [{ title: 'Recent Movies', data: sortedByYear }];
            case 'Action':
                return [{ title: 'Action', data: actionMovies }];
            case 'Adventure':
                return [{ title: 'Adventure', data: adventureMovies }];
            case 'Animation':
                return [{ title: 'Animation', data: animationMovies }];
            case 'Comedy':
                return [{ title: 'Comedy', data: comedyMovies }];
            case 'Crime':
                return [{ title: 'Crime', data: crimeMovies }];
            case 'Documentary':
                return [{ title: 'Documentary', data: documentaryMovies }];
            case 'Drama':
                return [{ title: 'Drama', data: dramaMovies }];
            case 'Family':
                return [{ title: 'Family', data: familyMovies }];
            case 'Fantasy':
                return [{ title: 'Fantasy', data: fantasyMovies }];
            case 'Horror':
                return [{ title: 'Horror', data: horrorMovies }];
            case 'Mystery':
                return [{ title: 'Mystery', data: mysteryMovies }];
            case 'Romance':
                return [{ title: 'Romance', data: romanceMovies }];
            case 'Sci-Fi':
                return [{ title: 'Sci-Fi', data: scifiMovies }];
            case 'Thriller':
                return [{ title: 'Thriller', data: thrillerMovies }];
            default:
                return [{ title: 'Most Popular', data: popularMovies }];
        }
    };

    const filteredSections = getFilteredContent();

    // Get all items for grid view and remove duplicates
    const allItemsWithDuplicates = filteredSections.flatMap(section => section.data);
    const allItems = Array.from(
        new Map(allItemsWithDuplicates.filter(item => item?.id).map(item => [item.id, item])).values()
    );

    // Calculate pagination
    const totalPages = Math.ceil(allItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = allItems.slice(startIndex, endIndex);

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 7;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-black">
            {isPopularLoading ? (
                <LoadingAnimation />
            ) : (
                <>
                    <InfoModal visible={isOpen} onClose={closeModal} />
                    <Navbar />

                    {/* Header Section */}
                    <div className="pt-32 pb-4 px-4 md:px-12">
                        <h1 className="text-white text-4xl md:text-5xl font-bold mb-6">
                            Movies
                        </h1>

                        {/* Filter Tabs */}
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => handleFilterChange(filter)}
                                    className={`
                                        px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all
                                        ${selectedFilter === filter
                                            ? 'bg-white text-black'
                                            : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                        }
                                    `}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Movies Sections */}
                    <div className="pb-40 px-4 md:px-12">
                        {selectedFilter === 'All' ? (
                            // Show horizontal rows for "All" filter
                            <>
                                {filteredSections.map((section) => (
                                    section.data.length > 0 && (
                                        <MovieList key={section.title} title={section.title} data={section.data.filter((item: any) => item?.id)} />
                                    )
                                ))}
                                {filteredSections.every(section => section.data.length === 0) && (
                                    <div className="flex items-center justify-center h-64">
                                        <p className="text-gray-400 text-xl">No movies available</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Show grid layout for other filters
                            <>
                                {currentItems.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {currentItems.map((item) => (
                                                <div key={item.id} className="group relative cursor-pointer">
                                                    <div
                                                        onClick={() => {
                                                            const modal = useInfoModalStore.getState();
                                                            modal.openModal(item.id);
                                                        }}
                                                        className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-800"
                                                    >
                                                        <img
                                                            src={item.thumbnailUrl}
                                                            alt={item.title}
                                                            draggable={false}
                                                            className="object-cover w-full h-full transition-transform duration-300 md:group-hover:scale-110"
                                                        />
                                                        {/* Hover overlay - Desktop only */}
                                                        <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-3">
                                                            <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                                                {item.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                {item.year && (
                                                                    <span className="text-green-400">{item.year}</span>
                                                                )}
                                                                {item.rating && (
                                                                    <span className="flex items-center gap-1 text-gray-300">
                                                                        <span className="text-yellow-400">★</span> {item.rating.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex flex-col items-center gap-4 mt-8">
                                                {/* Page info */}
                                                <div className="text-gray-400 text-sm">
                                                    Page {currentPage} of {totalPages} ({allItems.length} movies)
                                                </div>

                                                {/* Pagination controls */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        Previous
                                                    </button>

                                                    {getPageNumbers().map((page, index) => (
                                                        page === '...' ? (
                                                            <span key={`ellipsis-${index}`} className="text-gray-400 px-2">
                                                                ...
                                                            </span>
                                                        ) : (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page as number)}
                                                                className={`
                                                                    px-4 py-2 rounded-md transition
                                                                    ${currentPage === page
                                                                        ? 'bg-white text-black'
                                                                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                                                    }
                                                                `}
                                                            >
                                                                {page}
                                                            </button>
                                                        )
                                                    ))}

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-64">
                                        <p className="text-gray-400 text-xl">No movies available for this filter</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <style jsx>{`
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                        .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                </>
            )}
        </div>
    );
};

export default Movies;
