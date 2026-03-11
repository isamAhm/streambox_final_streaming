import React, { useCallback } from 'react';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import { MovieInterface } from '@/types';
import useInfoModalStore from '@/hooks/useInfoModalStore';

interface SearchMovieCardProps {
    data: MovieInterface;
}

const SearchMovieCard: React.FC<SearchMovieCardProps> = React.memo(({ data }) => {
    const { openModal } = useInfoModalStore();

    const handleClick = useCallback(() => {
        openModal(data.id);
    }, [openModal, data.id]);

    return (
        <div className="group relative w-full cursor-pointer" onClick={handleClick}>
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-800">
                <img
                    src={data.thumbnailUrl}
                    alt={data.title}
                    draggable={false}
                    className="object-cover w-full h-full transition-all duration-300 md:group-hover:scale-105 md:group-hover:brightness-75"
                />

                {/* Minimalistic Hover Overlay - Desktop only */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Info Icon - Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                            <PlayCircleIcon className="w-7 h-7 text-black" />
                        </div>
                    </div>

                    {/* Info at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                            {data.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs">
                            {data.year && (
                                <span className="text-gray-300">{data.year}</span>
                            )}
                            {data.rating && (
                                <span className="flex items-center gap-1 text-gray-300">
                                    • <span className="text-yellow-400">★</span> {data.rating.toFixed(1)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Title Below (visible when not hovering) */}
            <div className="mt-2 md:group-hover:opacity-0 transition-opacity duration-300">
                <h3 className="text-white text-sm font-semibold truncate">
                    {data.title}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    {data.year && (
                        <span className="text-gray-400">{data.year}</span>
                    )}
                    {data.rating && (
                        <span className="flex items-center gap-1 text-gray-400">
                            • <span className="text-yellow-400">★</span> {data.rating.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

SearchMovieCard.displayName = 'SearchMovieCard';

export default SearchMovieCard;
