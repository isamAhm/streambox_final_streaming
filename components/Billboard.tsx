import React, { useCallback, useState, useEffect } from 'react';
import { InformationCircleIcon, PlayIcon, FilmIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import PlayButton from '@/components/PlayButton';
import WatchlistButton from '@/components/WatchlistButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useTrending from '@/hooks/useTrending';
import axios from 'axios';

const Billboard = React.memo(() => {
  const { openModal } = useInfoModalStore();
  const { data: trendingMovies = [], isLoading: isTrendingLoading } = useTrending();
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerFetchedId, setTrailerFetchedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [movieQueue, setMovieQueue] = useState<any[]>([]);
  const [trailersEnabled, setTrailersEnabled] = useState(false);
  const [autoRotateInterval, setAutoRotateInterval] = useState<NodeJS.Timeout | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleOpenModal = useCallback(() => {
    if (movieQueue.length > 0) {
      openModal(movieQueue[currentIndex]?.id);
    }
  }, [openModal, movieQueue, currentIndex]);

  // Initialize trailer preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('billboard-trailers-enabled');
    setTrailersEnabled(savedPreference === 'true');
  }, []);

  // Initialize movie queue from trending movies with random starting position
  useEffect(() => {
    if (trendingMovies.length > 0) {
      // Use trending movies as the main queue (take first 8-10 for optimal performance)
      const queue = trendingMovies.slice(0, 8);
      setMovieQueue(queue);

      // Randomly select starting index on page refresh
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randomIndex);
    }
  }, [trendingMovies]);

  // Get current main movie
  const mainMovie = movieQueue.length > 0 ? movieQueue[currentIndex] : null;

  // Fade the billboard in once the first movie is available
  useEffect(() => {
    if (mainMovie?.id && !isReady) {
      const frame = requestAnimationFrame(() => setIsReady(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [mainMovie?.id, isReady]);

  // Toggle trailer preference and save to localStorage
  const toggleTrailers = useCallback(() => {
    const newState = !trailersEnabled;
    setTrailersEnabled(newState);
    localStorage.setItem('billboard-trailers-enabled', newState.toString());

    // If turning off trailers, hide current trailer
    if (!newState) {
      setShowTrailer(false);
    }
  }, [trailersEnabled]);

  // Auto-rotation effect - only when trailers are disabled
  useEffect(() => {
    // Clear any existing interval
    if (autoRotateInterval) {
      clearInterval(autoRotateInterval);
      setAutoRotateInterval(null);
    }

    // Only start auto-rotation if trailers are disabled and we have movies
    if (!trailersEnabled && movieQueue.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % movieQueue.length);
      }, 5000); // Change every 5 seconds

      setAutoRotateInterval(interval);
    }

    // Cleanup function
    return () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    };
  }, [trailersEnabled, movieQueue.length, autoRotateInterval]);

  // Smooth transition effect when currentIndex changes
  useEffect(() => {
    if (movieQueue.length > 0) {
      setIsTransitioning(true);

      // End transition after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 600); // Match the CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [currentIndex, movieQueue.length]);

  // Clear auto-rotation on manual navigation
  const clearAutoRotation = useCallback(() => {
    if (autoRotateInterval) {
      clearInterval(autoRotateInterval);
      setAutoRotateInterval(null);
    }
  }, [autoRotateInterval]);

  // Get next 3 movies in the queue (circular)
  const getUpNextMovies = useCallback(() => {
    if (movieQueue.length === 0) return [];

    const upNext = [];
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (currentIndex + i) % movieQueue.length;
      upNext.push(movieQueue[nextIndex]);
    }
    return upNext;
  }, [movieQueue, currentIndex]);

  const upNextMovies = getUpNextMovies();

  // Handle thumbnail click - move to that specific movie in the queue
  const handleThumbnailClick = useCallback((thumbnailIndex: number) => {
    clearAutoRotation();
    // Calculate the actual index in the movie queue
    const targetIndex = (currentIndex + thumbnailIndex + 1) % movieQueue.length;
    setCurrentIndex(targetIndex);
    setShowTrailer(false);
  }, [currentIndex, movieQueue.length, clearAutoRotation]);

  // Navigate to previous movie in the circular queue
  const handlePrevious = useCallback(() => {
    clearAutoRotation();
    setCurrentIndex((prev) => (prev === 0 ? movieQueue.length - 1 : prev - 1));
    setShowTrailer(false);
  }, [movieQueue.length, clearAutoRotation]);

  // Navigate to next movie in the circular queue
  const handleNext = useCallback(() => {
    clearAutoRotation();
    setCurrentIndex((prev) => (prev + 1) % movieQueue.length);
    setShowTrailer(false);
  }, [movieQueue.length, clearAutoRotation]);

  // Re-fetch trailer whenever the main movie changes or trailer preference changes
  useEffect(() => {
    if (!mainMovie?.id || mainMovie.id === trailerFetchedId) return;

    setShowTrailer(false);
    setTrailerFetchedId(mainMovie.id);

    // Only fetch trailer if trailers are enabled
    if (!trailersEnabled) {
      setTrailerUrl(null);
      return;
    }

    // Check sessionStorage first
    const cacheKey = `trailer:${mainMovie.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setTrailerUrl(cached);
      setTimeout(() => setShowTrailer(true), 500);
      return;
    }

    setTrailerUrl(null);
    axios.get(`/api/movies/trailer/${mainMovie.id}`)
      .then(response => {
        const url = response.data.trailerUrl;
        if (url) sessionStorage.setItem(cacheKey, url);
        setTrailerUrl(url);
        setTimeout(() => setShowTrailer(true), 500);
      })
      .catch(() => setTrailerUrl(null));
  }, [mainMovie?.id, trailerFetchedId, trailersEnabled]);

  // Cleanup auto-rotation on component unmount
  useEffect(() => {
    return () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    };
  }, [autoRotateInterval]);

  // Show loading state while trending data is being fetched
  if (isTrendingLoading || !mainMovie) {
    return (
      <div className="relative h-[56.25vw] bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className={`relative h-[56.25vw] overflow-hidden transition-opacity duration-1000 ease-out ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      {/* Main Backdrop */}
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-700 ease-in-out ${showTrailer && trailerUrl && trailersEnabled ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `url(${mainMovie?.backdropUrl || mainMovie?.thumbnailUrl})`,
          backgroundPosition: 'center top',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* YouTube Trailer */}
      {trailerUrl && trailersEnabled && (
        <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${showTrailer ? 'opacity-100' : 'opacity-0'}`}>
          <iframe
            src={trailerUrl}
            className="absolute inset-0 w-full h-full border-0 brightness-[60%]"
            allow="autoplay; encrypted-media"
            title={`${mainMovie?.title} Trailer`}
            style={{ pointerEvents: 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Content - Left side */}
      <div className="absolute inset-0 flex flex-col justify-center ml-4 md:ml-16 z-20">
        <div className={`max-w-lg lg:max-w-2xl transition-all duration-600 ease-out transform ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}>
          {/* Netflix-style badge */}
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-2 text-white/90">
              <span className="text-red-600 font-bold text-sm tracking-wider">STREAMBOX</span>
              <span className="text-xs">•</span>
              <span className="text-xs font-semibold">
                {mainMovie?.type === 'tv' ? 'SERIES' : 'MOVIE'}
              </span>
              <span className="text-xs">•</span>
              <span className="text-xs">{mainMovie?.year || '2024'}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-wider">
            {mainMovie?.title}
          </h1>

          {/* Rating and Genre */}
          <div className="flex items-center mb-4 space-x-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-yellow-400 text-sm ${i < Math.floor((mainMovie?.rating || 0) / 2) ? 'opacity-100' : 'opacity-30'
                    }`}
                >
                  ★
                </span>
              ))}
              <span className="text-white/80 ml-2 text-sm font-medium">
                {((mainMovie?.rating || 0) / 2).toFixed(1)}
              </span>
            </div>
            <span className="text-white/60 text-sm">{mainMovie?.genre}</span>
            <span className="text-white/60 text-sm">{mainMovie?.duration}</span>
          </div>

          {/* Description */}
          <p className="text-white/90 text-sm md:text-base lg:text-lg mb-8 leading-relaxed max-w-md lg:max-w-lg line-clamp-3">
            {mainMovie?.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <PlayButton movieId={mainMovie?.id} />

            <button
              onClick={handleOpenModal}
              className="
                bg-white/20
                backdrop-blur-sm
                text-white
                rounded-md
                py-2 md:py-3
                px-4 md:px-6
                text-sm lg:text-base
                font-semibold
                flex
                items-center
                hover:bg-white/30
                transition-all
                duration-200
                border border-white/30
                hover:border-white/50
              "
            >
              <InformationCircleIcon className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              More Info
            </button>

            <WatchlistButton movieId={mainMovie?.id} movieTitle={mainMovie?.title} />
          </div>
        </div>
      </div>

      {/* Up Next Thumbnails - Bottom Right */}
      {upNextMovies.length > 0 && (
        <div className={`absolute bottom-80 right-8 z-30 transition-all duration-500 ease-out transform ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80 tracking-wide">UP NEXT</h3>

            {/* Trailer Toggle Button */}
            <button
              onClick={toggleTrailers}
              className={`ml-4 flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${trailersEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white/80 hover:text-white'
                }`}
              title={trailersEnabled ? 'Disable trailers' : 'Enable trailers'}
            >
              <FilmIcon className="w-3 h-3 mr-1" />
              {trailersEnabled ? 'Trailers On' : 'Trailers Off'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous Arrow */}
            <button
              onClick={handlePrevious}
              className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors duration-200"
            >
              <ChevronLeftIcon className="w-4 h-4 text-white" />
            </button>

            {/* Thumbnails - Only show next 3 movies */}
            <div className="flex space-x-3">
              {upNextMovies.map((movie, index) => (
                <div
                  key={`${movie.id}-${index}`}
                  className="flex flex-col items-center"
                >
                  <button
                    onClick={() => handleThumbnailClick(index)}
                    className="relative group transition-all duration-200 hover:scale-105 hover:ring-1 hover:ring-white/50"
                  >
                    <div className="w-24 h-14 md:w-28 md:h-16 rounded-md overflow-hidden shadow-lg">
                      <img
                        src={movie.backdropUrl || movie.thumbnailUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                        <PlayIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                  </button>

                  {/* Movie title below thumbnail */}
                  <div className="mt-2 px-1 max-w-24 md:max-w-28">
                    <p className="text-white text-xs font-medium text-center leading-tight line-clamp-2">
                      {movie.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Arrow */}
            <button
              onClick={handleNext}
              className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors duration-200"
            >
              <ChevronRightIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Progress indicators - Shows position in the entire queue */}
          <div className={`flex justify-center mt-4 space-x-1 transition-all duration-500 ease-out ${isTransitioning ? 'opacity-50' : 'opacity-100'
            }`}>
            {movieQueue.slice(0, Math.min(8, movieQueue.length)).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  clearAutoRotation();
                  setCurrentIndex(index);
                  setShowTrailer(false);
                }}
                className={`w-6 h-0.5 rounded-full transition-colors duration-200 hover:bg-white/60 ${index === currentIndex ? 'bg-white' : 'bg-white/30'
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
    </div>
  );
});

Billboard.displayName = 'Billboard';

export default Billboard;