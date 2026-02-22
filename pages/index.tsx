import React, { useEffect, useState } from 'react';
import { NextPageContext } from 'next';

import Navbar from '@/components/Navbar';
import Billboard from '@/components/Billboard';
import MovieList from '@/components/MovieList';
import ContinueWatchingList from '@/components/ContinueWatchingList';
import InfoModal from '@/components/InfoModal';
import useMovieList from '@/hooks/useMovieList';
import useFavorites from '@/hooks/useFavorites';
import useContinueWatching from '@/hooks/useContinueWatching';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import { LoadingAnimation } from '@/components/loading-animation';


const Home = () => {
  const { data: movies = [], isLoading: isMoviesLoading } = useMovieList();
  const { data: favorites = [], isLoading: isFavoritesLoading } = useFavorites();
  const { data: continueWatching = [], isLoading: isContinueWatchingLoading, error: continueWatchingError } = useContinueWatching();
  const { isOpen, closeModal } = useInfoModalStore();

  const isLoading = isMoviesLoading || isFavoritesLoading;

  // Debug logging
  useEffect(() => {
    console.log('Continue Watching Data:', continueWatching);
    console.log('Continue Watching Loading:', isContinueWatchingLoading);
    console.log('Continue Watching Error:', continueWatchingError);
  }, [continueWatching, isContinueWatchingLoading, continueWatchingError]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {isLoading ? (
        <LoadingAnimation />
      ) : (
        <>
          <InfoModal visible={isOpen} onClose={closeModal} />
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
          </div>
        </>
      )}
    </div>
  )
}
export default Home;
