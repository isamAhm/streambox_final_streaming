import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';

export interface AnimeItem {
    description: JSX.Element;
    genres: any;
    id: string;
    title: { romaji: string; english: string | null; native?: string };
    image: string;
    rating?: number | null;
    totalEpisodes?: number | null;
    releaseDate?: number | null;
    type?: string | null;
}

interface AnimeListProps {
    data: AnimeItem[];
    title: string;
}

const AnimeCard: React.FC<{ item: AnimeItem }> = React.memo(({ item }) => {
    const router = useRouter();
    const label = item.title.english || item.title.romaji;

    return (
        <div
            onClick={() => router.push(`/anime/${item.id}`)}
            className="cursor-pointer group relative"
        >
            {/* Portrait poster */}
            <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-zinc-800 shadow-xl">
                <img
                    src={item.image}
                    alt={label}
                    draggable={false}
                    className="object-cover w-full h-full"
                />
                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="bg-white rounded-full p-2">
                        <PlayIcon className="w-5 h-5 text-black ml-0.5" />
                    </div>
                </div>
                {/* Rating badge */}
                {item.rating && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                        ★ {(item.rating / 10).toFixed(1)}
                    </div>
                )}
            </div>
            {/* Title */}
            <p className="text-white text-xs font-semibold mt-2 truncate">{label}</p>
            <p className="text-zinc-500 text-[10px] mt-0.5">
                {item.releaseDate}{item.totalEpisodes ? ` · ${item.totalEpisodes} eps` : ''}
            </p>
        </div>
    );
});
AnimeCard.displayName = 'AnimeCard';

const AnimeList: React.FC<AnimeListProps> = ({ data, title }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = useCallback(() => {
        if (!listRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
        setShowLeft(scrollLeft > 10);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => { checkScroll(); }, [checkScroll]);

    const scroll = useCallback((dir: 'left' | 'right') => {
        if (!listRef.current) return;
        const amount = listRef.current.clientWidth * 0.7;
        listRef.current.scrollTo({
            left: listRef.current.scrollLeft + (dir === 'right' ? amount : -amount),
            behavior: 'smooth',
        });
    }, []);

    if (!data || data.length === 0) return null;

    return (
        <div className="px-4 md:px-12 mt-4 mb-8">
            <p className="text-white text-md md:text-xl lg:text-2xl font-semibold mb-4">{title}</p>

            <div className="relative group/list">
                {/* Left arrow */}
                {showLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-40 w-12 md:w-16 bg-gradient-to-r from-black/90 via-black/60 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300 hover:from-black"
                    >
                        <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                            <ChevronLeftIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                    </button>
                )}

                {/* Scrollable row */}
                <div
                    ref={listRef}
                    onScroll={checkScroll}
                    className="flex gap-2 overflow-x-scroll scrollbar-hide scroll-smooth pb-4 pt-2 px-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {data.map((item) => (
                        <div
                            key={item.id}
                            className="flex-none w-[120px] sm:w-[140px] md:w-[155px] lg:w-[170px]"
                        >
                            <AnimeCard item={item} />
                        </div>
                    ))}
                </div>

                {/* Right arrow */}
                {showRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-40 w-12 md:w-16 bg-gradient-to-l from-black/90 via-black/60 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300 hover:from-black"
                    >
                        <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                            <ChevronRightIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AnimeList;
