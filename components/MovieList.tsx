import React, { useRef, useState } from 'react';
import { MovieInterface } from '@/types';
import MovieCard from '@/components/MovieCard';
import { isEmpty } from 'lodash';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MovieListProps {
  data: MovieInterface[];
  title: string;
  horizontal?: boolean;
}

const MovieList: React.FC<MovieListProps> = ({ data, title, horizontal }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showArrows, setShowArrows] = useState(false);

  if (isEmpty(data)) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!listRef.current) return;
    
    const { scrollLeft, clientWidth } = listRef.current;
    const scrollTo = direction === 'left' 
      ? scrollLeft - clientWidth 
      : scrollLeft + clientWidth;

    listRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    setScrollPosition(scrollTo);
  };

  return (
    <div className="px-4 md:px-12 mt-4 space-y-8 relative"
         onMouseEnter={() => setShowArrows(true)}
         onMouseLeave={() => setShowArrows(false)}>
      <p className="text-white text-md md:text-xl lg:text-2xl font-semibold mb-4">
        {title}
      </p>
      
      <div className="relative">
        {horizontal ? (
          <>
            <div 
              ref={listRef}
              className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-transparent space-x-4 pr-4 xl:pb-0 pb-11 max-md:h-[270px] max-lg:h-[300px] max-xl:h-[400px] xl:h-[500px]"
            >
              {data.map((movie) => (
                <div 
                  key={movie.id} 
                  className="flex-shrink min-w-[250px] max-sm:min-w-[150px] sm:w-[250px] md:min-w-[250px] xl:min-w-[460px] lg:h-fit relative transition-transform"
                >
                  <MovieCard data={movie} />
                </div>
              ))}
            </div>

            {showArrows && data.length > 2 && (
              <>
                <button 
                  onClick={() => handleScroll('left')}
                  className=" max-md:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2 hover:bg-black/90 transition z-50"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <button 
                  onClick={() => handleScroll('right')}
                  className={`max-md:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2 hover:bg-black/90 transition z-50 ${
                    scrollPosition >= (listRef.current?.scrollWidth || 0) - (listRef.current?.clientWidth || 0) 
                      ? 'opacity-0' 
                      : 'opacity-100'
                  }`}
                >
                  <ChevronRightIcon className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 gap-y-8">
            {data.map((movie) => (
              <MovieCard key={movie.id} data={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieList;