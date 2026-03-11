import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { MovieInterface } from '@/types';
import WatchlistButton from '@/components/WatchlistButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';

interface MovieCardProps {
  data: MovieInterface;
}

const MovieCard: React.FC<MovieCardProps> = React.memo(({ data }) => {
  const router = useRouter();
  const { openModal, isOpen } = useInfoModalStore();
  const [forceHideHover, setForceHideHover] = useState(false);

  const redirectToWatch = useCallback(() => router.push(`/watch/${data.id}`), [router, data.id]);

  const handleOpenModal = useCallback(() => {
    setForceHideHover(true);
    openModal(data?.id);
  }, [openModal, data?.id]);

  // Reset hover state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForceHideHover(false);
    }
  }, [isOpen]);

  return (
    <div className="group relative h-full">
      {/* Main Card - Portrait */}
      <div className={`relative aspect-[2/3] w-full transition-all duration-300 ease-in-out ${forceHideHover ? 'scale-100 opacity-100' : 'md:group-hover:scale-0 md:group-hover:opacity-0'}`}>
        <img
          onClick={handleOpenModal}
          src={data.thumbnailUrl}
          alt={data.title}
          draggable={false}
          className="cursor-pointer object-cover w-full h-full rounded-md shadow-xl"
        />
      </div>

      {/* Title below card */}
      <p className={`text-white text-sm mt-2 font-semibold truncate transition-opacity duration-300 ${forceHideHover ? 'opacity-100' : 'md:group-hover:opacity-0'}`}>
        {data.title}
      </p>

      {/* Hover Card - Landscape with poster - Only on desktop */}
      <div className={`
        hidden
        md:block
        absolute 
        top-10 
        left-0
        w-full
        transition-all 
        duration-300 
        ease-in-out
        z-50
        ${forceHideHover
          ? 'opacity-0 scale-0 pointer-events-none'
          : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-150'
        }
      `}>
        <div className="bg-zinc-900 rounded-md shadow-2xl overflow-hidden">
          {/* Landscape Image - 16:9 */}
          <div className="relative w-full aspect-video">
            <img
              onClick={redirectToWatch}
              src={data.thumbnailUrl}
              alt={data.title}
              draggable={false}
              className="cursor-pointer object-cover w-full h-full"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>

          {/* Details */}
          <div className="p-3 space-y-2">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={redirectToWatch}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition"
              >
                <PlayIcon className="w-4 h-4 text-black ml-0.5" />
              </button>
              <WatchlistButton movieId={data.id} movieTitle={data.title} />
              <button
                onClick={handleOpenModal}
                className="ml-auto w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition"
              >
                <ChevronDownIcon className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-sm line-clamp-1">
              {data.title}
            </h3>

            {/* Meta Info */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {data.year && <span className="text-green-400">{data.year}</span>}
              {data.duration && <span>• {data.duration}</span>}
              {data.rating && (
                <span className="flex items-center gap-1">
                  • <span className="text-yellow-400">★</span> {data.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Genre */}
            {data.genre && (
              <p className="text-xs text-gray-400 line-clamp-1">{data.genre}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';

export default MovieCard;
