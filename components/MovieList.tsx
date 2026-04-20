import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { MovieInterface } from '@/types';
import MovieCard from '@/components/MovieCard';
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (!listRef.current) return;

    const scrollAmount = listRef.current.clientWidth * 0.7;
    const newScrollLeft = direction === 'left'
      ? listRef.current.scrollLeft - scrollAmount
      : listRef.current.scrollLeft + scrollAmount;

    listRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  }, []);

  const checkScrollPosition = useCallback(() => {
    if (listRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);

      // Calculate visible range for virtual scrolling
      if (data.length > 50) {
        const cardWidth = 200; // approximate card width
        const startIndex = Math.max(0, Math.floor(scrollLeft / cardWidth) - 5);
        const endIndex = Math.min(data.length, Math.ceil((scrollLeft + clientWidth) / cardWidth) + 5);
        setVisibleRange({ start: startIndex, end: endIndex });
      }
    }
  }, [data.length]);

  // Throttled hover handler
  const handleMouseEnter = useCallback((index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(index);
    }, 50); // 50ms throttle
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredIndex(null);
  }, []);

  useEffect(() => {
    checkScrollPosition();
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [checkScrollPosition]);

  // Determine if we should use virtual scrolling
  const useVirtualScrolling = data.length > 50;
  const visibleData = useMemo(() => {
    if (!useVirtualScrolling) return data;
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, useVirtualScrolling, visibleRange]);

  if (!data || data.length === 0) return null;

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
          className="flex gap-2 overflow-x-scroll scrollbar-hide scroll-smooth pb-14 pt-8 px-0 md:px-12 "
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Spacer for virtual scrolling */}
          {useVirtualScrolling && visibleRange.start > 0 && (
            <div style={{ minWidth: `${visibleRange.start * 200}px` }} />
          )}

          {(useVirtualScrolling ? visibleData : data).filter(movie => movie?.id).map((movie, idx) => {
            const index = useVirtualScrolling ? visibleRange.start + idx : idx;
            const isHovered = hoveredIndex === index;
            const isBeforeHovered = hoveredIndex !== null && index < hoveredIndex;
            const isAfterHovered = hoveredIndex !== null && index > hoveredIndex;
            const isFirst = index === 0;
            const isLast = index === data.length - 1;

            // Calculate transform value
            const transformValue = isBeforeHovered
              ? '-25%'
              : isAfterHovered
                ? '25%'
                : '0';

            return (
              <div
                key={movie.id}
                className="movie-card-wrapper flex-none w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                style={{
                  '--transform-x': transformValue,
                  '--z-index': isHovered ? 60 : 10,
                  '--transform-origin': isFirst ? 'left' : isLast ? 'right' : 'center',
                } as React.CSSProperties}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <MovieCard data={movie} />
              </div>
            );
          })}

          {/* Spacer for virtual scrolling */}
          {useVirtualScrolling && visibleRange.end < data.length && (
            <div style={{ minWidth: `${(data.length - visibleRange.end) * 200}px` }} />
          )}
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
        
        .movie-card-wrapper {
          transition: transform 300ms ease-in-out;
          transform: translateX(var(--transform-x));
          z-index: var(--z-index);
          transform-origin: var(--transform-origin);
          will-change: transform;
        }
      `}</style>
    </div>
  );
}

export default MovieList;
