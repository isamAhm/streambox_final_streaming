import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Navbar from '@/components/Navbar';
import MovieList from '@/components/MovieList';
import InfoModal from '@/components/InfoModal';
import useSeries from '@/hooks/useSeries';
import useSeriesByGenre from '@/hooks/useSeriesByGenre';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import { LoadingAnimation } from '@/components/loading-animation';

const Series = () => {
    const { data: popularSeries = [], isLoading: isPopularLoading, mutate } = useSeries();
    const { isOpen, closeModal } = useInfoModalStore();
    const [selectedFilter, setSelectedFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30; // 6 columns x 5 rows = 30 items per page

    // Auto-fetch more series on initial load
    useEffect(() => {
        const autoFetch = async () => {
            try {
                for (let i = 0; i < 5; i++) {
                    await axios.get(`/api/movies/series?fetchMore=true`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                mutate();
            } catch {
                // Background fetch failed — not critical, existing data still shows
            }
        };

        if (popularSeries.length < 100) {
            autoFetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch series by genre
    const { data: actionSeries = [] } = useSeriesByGenre('Action');
    const { data: animationSeries = [] } = useSeriesByGenre('Animation');
    const { data: comedySeries = [] } = useSeriesByGenre('Comedy');
    const { data: crimeSeries = [] } = useSeriesByGenre('Crime');
    const { data: documentarySeries = [] } = useSeriesByGenre('Documentary');
    const { data: dramaSeries = [] } = useSeriesByGenre('Drama');
    const { data: familySeries = [] } = useSeriesByGenre('Family');
    const { data: kidsSeries = [] } = useSeriesByGenre('Kids');
    const { data: mysterySeries = [] } = useSeriesByGenre('Mystery');
    const { data: realitySeries = [] } = useSeriesByGenre('Reality');
    const { data: scifiSeries = [] } = useSeriesByGenre('Sci-Fi');
    const { data: thrillerSeries = [] } = useSeriesByGenre('Thriller');

    const filters = [
        'All',
        'Most popular',
        'Most rating',
        'Most recent',
        'Action & Adventure',
        'Animation',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Family',
        'Kids',
        'Mystery',
        'Reality',
        'Sci-Fi'
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
                // Show all genres
                return [
                    { title: 'Most Popular', data: popularSeries },
                    { title: 'Action & Adventure', data: actionSeries },
                    { title: 'Animation', data: animationSeries },
                    { title: 'Comedy', data: comedySeries },
                    { title: 'Crime', data: crimeSeries },
                    { title: 'Documentary', data: documentarySeries },
                    { title: 'Drama', data: dramaSeries },
                    { title: 'Family', data: familySeries },
                    { title: 'Kids', data: kidsSeries },
                    { title: 'Mystery', data: mysterySeries },
                    { title: 'Reality', data: realitySeries },
                    { title: 'Sci-Fi & Fantasy', data: scifiSeries },
                    { title: 'Thriller', data: thrillerSeries },
                ];
            case 'Most popular':
                return [{ title: 'Most Popular', data: popularSeries }];
            case 'Most rating':
                // Sort by rating
                const sortedByRating = [...popularSeries].sort((a, b) => (b.rating || 0) - (a.rating || 0));
                return [{ title: 'Top Rated Series', data: sortedByRating }];
            case 'Most recent':
                // Sort by year
                const sortedByYear = [...popularSeries].sort((a, b) => (b.year || 0) - (a.year || 0));
                return [{ title: 'Recent Series', data: sortedByYear }];
            case 'Action & Adventure':
                return [{ title: 'Action & Adventure', data: actionSeries }];
            case 'Animation':
                return [{ title: 'Animation', data: animationSeries }];
            case 'Comedy':
                return [{ title: 'Comedy', data: comedySeries }];
            case 'Crime':
                return [{ title: 'Crime', data: crimeSeries }];
            case 'Documentary':
                return [{ title: 'Documentary', data: documentarySeries }];
            case 'Drama':
                return [{ title: 'Drama', data: dramaSeries }];
            case 'Family':
                return [{ title: 'Family', data: familySeries }];
            case 'Kids':
                return [{ title: 'Kids', data: kidsSeries }];
            case 'Mystery':
                return [{ title: 'Mystery', data: mysterySeries }];
            case 'Reality':
                return [{ title: 'Reality', data: realitySeries }];
            case 'Sci-Fi':
                return [{ title: 'Sci-Fi & Fantasy', data: scifiSeries }];
            default:
                return [{ title: 'Most Popular', data: popularSeries }];
        }
    };

    const filteredSections = getFilteredContent();

    // Get all items for grid view (flatten all sections) and remove duplicates
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
                            TV Shows
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

                    {/* Series Sections */}
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
                                        <p className="text-gray-400 text-xl">No series available</p>
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
                                                    Page {currentPage} of {totalPages} ({allItems.length} series)
                                                </div>

                                                {/* Pagination controls */}
                                                <div className="flex items-center gap-2">
                                                    {/* Previous Button */}
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        Previous
                                                    </button>

                                                    {/* Page Numbers */}
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

                                                    {/* Next Button */}
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
                                        <p className="text-gray-400 text-xl">No series available for this filter</p>
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

export default Series;
