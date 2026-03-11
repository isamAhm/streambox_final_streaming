import React, { useEffect } from 'react';

import Navbar from '@/components/Navbar';
import Billboard from '@/components/Billboard';
import MovieList from '@/components/MovieList';
import ContinueWatchingList from '@/components/ContinueWatchingList';
import dynamic from 'next/dynamic';
import useMovieList from '@/hooks/useMovieList';
import useFavorites from '@/hooks/useFavorites';
import useContinueWatching from '@/hooks/useContinueWatching';
import useSeries from '@/hooks/useSeries';
import useTopRated from '@/hooks/useTopRated';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import { LoadingAnimation } from '@/components/loading-animation';

// Lazy load InfoModal since it's not always needed
const InfoModal = dynamic(() => import('@/components/InfoModal'), {
  ssr: false,
});


const Home = () => {
  const { data: movies = [], isLoading: isMoviesLoading } = useMovieList();
  const { data: favorites = [], isLoading: isFavoritesLoading } = useFavorites();
  const { data: continueWatching = [], isLoading: isContinueWatchingLoading, error: continueWatchingError, mutate: mutateContinueWatching } = useContinueWatching();
  const { data: series = [], isLoading: isSeriesLoading } = useSeries();
  const { data: topRated = [], isLoading: isTopRatedLoading } = useTopRated();
  const { isOpen, closeModal } = useInfoModalStore();

  const isLoading = isMoviesLoading || isFavoritesLoading || isSeriesLoading || isTopRatedLoading;

  // Revalidate continue watching when component mounts (user returns from watch page)
  useEffect(() => {
    mutateContinueWatching();
  }, [mutateContinueWatching]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {isLoading ? (
        <LoadingAnimation />
      ) : (
        <>
          {isOpen && <InfoModal visible={isOpen} onClose={closeModal} />}
          <Navbar />
          <Billboard />
          <div className="pb-40">
            {/* Continue Watching Section */}
            {continueWatching && continueWatching.length > 0 && (
              <ContinueWatchingList data={continueWatching} />
            )}

            {/* Trending Now */}
            <MovieList title="Trending Now" data={movies} />

            {/* My List */}
            {favorites.length > 0 && (
              <MovieList title="My List" data={favorites} />
            )}

            {/* Series */}
            {series.length > 0 && (
              <MovieList title="Series" data={series} />
            )}

            {/* Top Rated */}
            {topRated.length > 0 && (
              <MovieList title="Top Rated" data={topRated} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
export default Home;
