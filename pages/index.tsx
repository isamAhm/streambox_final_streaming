import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/router';

import Navbar from '@/components/Navbar';
import Billboard from '@/components/Billboard';
import MovieList from '@/components/MovieList';
import ContinueWatchingList from '@/components/ContinueWatchingList';
import BrowseByProvider from '@/components/BrowseByProvider';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import useMovieList from '@/hooks/useMovieList';
import useFavorites from '@/hooks/useFavorites';
import useContinueWatching from '@/hooks/useContinueWatching';
import useGuestContinueWatching from '@/hooks/useGuestContinueWatching';
import { useGuestMode } from '@/contexts/GuestModeContext';
import useSeries from '@/hooks/useSeries';
import useTopRated from '@/hooks/useTopRated';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useTrending from '@/hooks/useTrending';
import { LoadingAnimation } from '@/components/loading-animation';

// Lazy load InfoModal since it's not always needed
const InfoModal = dynamic(() => import('@/components/InfoModal'), {
  ssr: false,
});


const Home = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { isGuestMode } = useGuestMode();
  const { data: movies = [], isLoading: isMoviesLoading } = useMovieList();
  const { data: trending = [], isLoading: isTrendingLoading } = useTrending();
  const { data: favorites = [], isLoading: isFavoritesLoading } = useFavorites();
  const { data: continueWatching = [], isLoading: isContinueWatchingLoading, error: continueWatchingError, mutate: mutateContinueWatching } = useContinueWatching();
  const { guestData: guestContinueWatching } = useGuestContinueWatching();
  const { data: series = [], isLoading: isSeriesLoading } = useSeries();
  const { data: topRated = [], isLoading: isTopRatedLoading } = useTopRated();
  const { isOpen, closeModal } = useInfoModalStore();

  const isLoading = isMoviesLoading || isTrendingLoading || isFavoritesLoading || isSeriesLoading || isTopRatedLoading;

  // Combine regular and guest continue watching data
  const activeContinueWatching = isGuestMode ? guestContinueWatching : continueWatching;

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/home');
    }
  }, [isLoaded, isSignedIn, router]);

  // Revalidate continue watching when component mounts (user returns from watch page)
  useEffect(() => {
    if (!isGuestMode) {
      mutateContinueWatching();
    }
  }, [mutateContinueWatching, isGuestMode]);

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
            {/* Browse by Provider Section */}
            <BrowseByProvider />

            {/* Continue Watching Section */}
            {activeContinueWatching && activeContinueWatching.length > 0 && (
              <ContinueWatchingList data={activeContinueWatching} />
            )}

            {/* Trending Now — from TMDB trending this week */}
            <MovieList title="Trending Now" data={trending.length > 0 ? trending : movies} />

            {/* My List - Hidden in guest mode */}
            {!isGuestMode && favorites.length > 0 && (
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
          <Footer />
        </>
      )}
    </div>
  )
}
export default Home;
