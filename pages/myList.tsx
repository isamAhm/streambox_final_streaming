import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import MovieList from '@/components/MovieList';
import InfoModal from '@/components/InfoModal';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useWatchlist from '@/hooks/useWatchlist';
import useFavorites from '@/hooks/useFavorites';

const MyList = () => {
    const { isOpen, closeModal } = useInfoModalStore();
    const [selectedFilter, setSelectedFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30; // 6 columns x 5 rows = 30 items per page

    const { data: watchingItems = [] } = useWatchlist('watching');
    const { data: completedItems = [] } = useWatchlist('completed');
    const { data: favorites = [] } = useFavorites(); // Plan to Watch

    const filters = [
        'All',
        'Plan to Watch',
        'Watching',
        'Completed'
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
                    { title: '📌 Plan to Watch', data: favorites },
                    { title: '📺 Watching', data: watchingItems },
                    { title: '✅ Completed', data: completedItems },
                ];
            case 'Plan to Watch':
                return [{ title: 'Plan to Watch', data: favorites }];
            case 'Watching':
                return [{ title: 'Watching', data: watchingItems }];
            case 'Completed':
                return [{ title: 'Completed', data: completedItems }];
            default:
                return [
                    { title: '📌 Plan to Watch', data: favorites },
                    { title: '📺 Watching', data: watchingItems },
                    { title: '✅ Completed', data: completedItems },
                ];
        }
    };

    const filteredSections = getFilteredContent();

    // Get all items for grid view and remove duplicates
    const allItemsWithDuplicates = filteredSections.flatMap(section => section.data);
    const allItems = Array.from(
        new Map(allItemsWithDuplicates.map(item => [item.id, item])).values()
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
            <InfoModal visible={isOpen} onClose={closeModal} />
            <Navbar />

            {/* Header Section */}
            <div className="pt-32 pb-4 px-4 md:px-12">
                <h1 className="text-white text-4xl md:text-5xl font-bold mb-6">
                    My List
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

            {/* Content Sections */}
            <div className="pb-40 px-4 md:px-12">
                {selectedFilter === 'All' ? (
                    // Show horizontal rows for "All" filter
                    <>
                        {filteredSections.map((section) => (
                            section.data.length > 0 && (
                                <MovieList key={section.title} title={section.title} data={section.data} />
                            )
                        ))}
                        {filteredSections.every(section => section.data.length === 0) && (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="text-6xl mb-4">📋</div>
                                <p className="text-gray-400 text-xl">Your list is empty. Start adding movies and shows!</p>
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
                                            Page {currentPage} of {totalPages} ({allItems.length} items)
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
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="text-6xl mb-4">
                                    {selectedFilter === 'Watching' && '📺'}
                                    {selectedFilter === 'Completed' && '✅'}
                                    {selectedFilter === 'Plan to Watch' && '📌'}
                                </div>
                                <p className="text-gray-400 text-xl">
                                    {selectedFilter === 'Watching' && 'No items currently watching'}
                                    {selectedFilter === 'Completed' && 'No completed items yet'}
                                    {selectedFilter === 'Plan to Watch' && 'No items planned to watch'}
                                </p>
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
        </div>
    );
};

export default MyList;
