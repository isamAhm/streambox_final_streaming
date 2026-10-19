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
import useBillboardBackdrop from '@/hooks/useBillboardBackdrop';
import { LoadingAnimation } from '@/components/loading-animation';
import {
  useTrendingMovies,
  useTrendingSeries,
  useNetflixMovies,
  useNetflixSeries,
  useAwardWinningMovies,
  useAwardWinningShows,
  useTopRatedMovies,
  useTopRatedSeries,
  useOscarNominees,
  usePsychologicalThrillers,
  useCannesFestival,
  useHalloweenMovies,
  useRottenTomatoesBest,
  useMindfuckMovies,
  useBasedOnTrueStory,
} from '@/hooks/useContentCategories';

// Lazy load InfoModal since it's not always needed
const InfoModal = dynamic(() => import('@/components/InfoModal'), {
  ssr: false,
});


const Home = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { isGuestMode } = useGuestMode();
  const { backdropUrl } = useBillboardBackdrop();
  const { data: movies = [], isLoading: isMoviesLoading } = useMovieList();
  const { data: trending = [], isLoading: isTrendingLoading } = useTrending();
  const { data: favorites = [], isLoading: isFavoritesLoading } = useFavorites();
  const { data: continueWatching = [], isLoading: isContinueWatchingLoading, error: continueWatchingError, mutate: mutateContinueWatching } = useContinueWatching();
  const { guestData: guestContinueWatching } = useGuestContinueWatching();
  const { data: series = [], isLoading: isSeriesLoading } = useSeries();
  const { data: topRated = [], isLoading: isTopRatedLoading } = useTopRated();
  const { isOpen, closeModal } = useInfoModalStore();

  // New content categories from TMDB
  const { data: trendingMovies = [] } = useTrendingMovies();
  const { data: trendingSeries = [] } = useTrendingSeries();
  const { data: netflixMovies = [] } = useNetflixMovies();
  const { data: netflixSeries = [] } = useNetflixSeries();
  const { data: awardWinningMovies = [] } = useAwardWinningMovies();
  const { data: awardWinningShows = [] } = useAwardWinningShows();
  const { data: topRatedMovies = [] } = useTopRatedMovies();
  const { data: topRatedSeries = [] } = useTopRatedSeries();
  const { data: oscarNominees = [] } = useOscarNominees();
  const { data: psychologicalThrillers = [] } = usePsychologicalThrillers();
  const { data: cannesFestival = [] } = useCannesFestival();
  const { data: halloweenMovies = [] } = useHalloweenMovies();
  const { data: rottenTomatoesBest = [] } = useRottenTomatoesBest();
  const { data: mindfuckMovies = [] } = useMindfuckMovies();
  const { data: basedOnTrueStory = [] } = useBasedOnTrueStory();

  const isLoading = isMoviesLoading || isTrendingLoading || isFavoritesLoading || isSeriesLoading || isTopRatedLoading;

  // Combine regular and guest continue watching data
  const activeContinueWatching = isGuestMode ? guestContinueWatching : continueWatching;

  // Redirect unauthenticated users (who are not in guest mode) to landing page
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isGuestMode) {
      // User is not signed in and not in guest mode -> show landing page
      router.replace('/home');
    }
  }, [isLoaded, isSignedIn, isGuestMode, router]);

  // Revalidate continue watching when component mounts (user returns from watch page)
  useEffect(() => {
    if (!isGuestMode) {
      mutateContinueWatching();
    }
  }, [mutateContinueWatching, isGuestMode]);

  // Don't render the main app for non-authenticated, non-guest users
  // They should see the landing page instead
  if (isLoaded && !isSignedIn && !isGuestMode) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative">
      {/* Dynamic Blurred Background */}
      <div
        className="fixed inset-0 w-full h-full transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Heavy blur and dark overlay */}
        <div className="absolute inset-0 backdrop-blur-3xl bg-black/70" />
      </div>

      {/* Content - positioned above background */}
      <div className="relative z-10">
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            {isOpen && <InfoModal visible={isOpen} onClose={closeModal} />}
            <Navbar />
            <Billboard />
            <div className="pb-40">
              {/* Continue Watching Section */}
              {activeContinueWatching && activeContinueWatching.length > 0 && (
                <ContinueWatchingList data={activeContinueWatching} />
              )}

              {/* My List - Right after Continue Watching */}
              {!isGuestMode && favorites.length > 0 && (
                <MovieList title="My List" data={favorites} />
              )}

              {/* Browse by Provider Section */}
              <BrowseByProvider />

              {/* Trending Movies */}
              {trendingMovies.length > 0 && (
                <MovieList title="Trending Movies" data={trendingMovies} />
              )}

              {/* Trending Series */}
              {trendingSeries.length > 0 && (
                <MovieList title="Trending Series" data={trendingSeries} />
              )}

              {/* Movies on Netflix */}
              {netflixMovies.length > 0 && (
                <MovieList title="Movies on Netflix" data={netflixMovies} />
              )}

              {/* TV Series on Netflix */}
              {netflixSeries.length > 0 && (
                <MovieList title="TV Series on Netflix" data={netflixSeries} />
              )}

              {/* Award Winning Movies */}
              {awardWinningMovies.length > 0 && (
                <MovieList title="Award Winning Movies" data={awardWinningMovies} />
              )}

              {/* Award Winning Shows */}
              {awardWinningShows.length > 0 && (
                <MovieList title="Award Winning Shows" data={awardWinningShows} />
              )}

              {/* Top Rated Movies */}
              {topRatedMovies.length > 0 && (
                <MovieList title="Top Rated Movies" data={topRatedMovies} />
              )}

              {/* Top Rated Series */}
              {topRatedSeries.length > 0 && (
                <MovieList title="Top Rated Series" data={topRatedSeries} />
              )}

              {/* Oscar Nominees for Best Picture */}
              {oscarNominees.length > 0 && (
                <MovieList title="Oscar Nominees for Best Picture" data={oscarNominees} />
              )}

              {/* Psychological Thrillers */}
              {psychologicalThrillers.length > 0 && (
                <MovieList title="Psychological Thrillers" data={psychologicalThrillers} />
              )}

              {/* Cannes Film Festival */}
              {cannesFestival.length > 0 && (
                <MovieList title="Cannes Film Festival" data={cannesFestival} />
              )}

              {/* Top 100 Halloween Movies */}
              {halloweenMovies.length > 0 && (
                <MovieList title="Top 100 Halloween Movies" data={halloweenMovies} />
              )}

              {/* Rotten Tomatoes: Best Movies of All Time */}
              {rottenTomatoesBest.length > 0 && (
                <MovieList title="Rotten Tomatoes: Best Movies of All Time" data={rottenTomatoesBest} />
              )}

              {/* Mindf*ck Movies */}
              {mindfuckMovies.length > 0 && (
                <MovieList title="Mindf*ck Movies" data={mindfuckMovies} />
              )}

              {/* Based on a True Story */}
              {basedOnTrueStory.length > 0 && (
                <MovieList title="Based on a True Story" data={basedOnTrueStory} />
              )}
            </div>
            <Footer />
          </>
        )}
      </div>
    </div>
  )
}
export default Home;
