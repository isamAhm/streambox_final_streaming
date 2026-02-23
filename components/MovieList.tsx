import React, { useRef, useState, useEffect } from 'react';
import { MovieInterface } from '@/types';
import MovieCard from '@/components/MovieCard';
import { isEmpty } from 'lodash';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MovieListProps {
  data: MovieInterface[];
  title: string;
}

const MovieList: React.FC<MovieListProps> = ({ data, title }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isEmpty(data)) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!listRef.current) return;

    const scrollAmount = listRef.current.clientWidth * 0.7;
    const newScrollLeft = direction === 'left'
      ? listRef.current.scrollLeft - scrollAmount
      : listRef.current.scrollLeft + scrollAmount;

    listRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const checkScrollPosition = () => {
    if (listRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
  }, []);

  return (
    <div className="px-4 md:px-12 mt-4 mb-8">
      <p className="text-white text-md md:text-xl lg:text-2xl font-semibold mb-4">
        {title}
      </p>

      <div className="relative group/list">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="
              absolute 
              left-0 
              top-0 
              bottom-0 
              z-40 
              w-12 
              md:w-16 
              bg-gradient-to-r 
              from-black/90 
              via-black/60 
              to-transparent 
              flex 
              items-center 
              justify-start
              pl-2
              opacity-0 
              group-hover/list:opacity-100 
              transition-opacity 
              duration-300
              hover:from-black
            "
          >
            <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
              <ChevronLeftIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </button>
        )}

        {/* Scrollable Container with padding for hover expansion */}
        <div
          ref={listRef}
          onScroll={checkScrollPosition}
          className="flex gap-2 overflow-x-scroll scrollbar-hide scroll-smooth pb-14 pt-8 px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {data.map((movie, index) => {
            const isHovered = hoveredIndex === index;
            const isBeforeHovered = hoveredIndex !== null && index < hoveredIndex;
            const isAfterHovered = hoveredIndex !== null && index > hoveredIndex;
            const isFirst = index === 0;
            const isLast = index === data.length - 1;

            return (
              <div
                key={movie.id}
                className="flex-none w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] transition-transform duration-300 ease-in-out"
                style={{
                  transform: isBeforeHovered
                    ? 'translateX(-25%)'
                    : isAfterHovered
                      ? 'translateX(25%)'
                      : 'translateX(0)',
                  zIndex: isHovered ? 60 : 10,
                  transformOrigin: isFirst ? 'left' : isLast ? 'right' : 'center',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <MovieCard data={movie} />
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="
              absolute 
              right-0 
              top-0 
              bottom-0 
              z-40 
              w-12 
              md:w-16 
              bg-gradient-to-l 
              from-black/90 
              via-black/60 
              to-transparent 
              flex 
              items-center 
              justify-end
              pr-2
              opacity-0 
              group-hover/list:opacity-100 
              transition-opacity 
              duration-300
              hover:from-black
            "
          >
            <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
              <ChevronRightIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </button>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default MovieList;
