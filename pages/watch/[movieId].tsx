import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import useMovie from '@/hooks/useMovie';
import { streamingService, StreamingSource } from '@/libs/streaming';
import axios from 'axios';

const Watch = () => {
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);

  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchStartTimeRef = useRef<number>(Date.now());

  // Track watch progress
  useEffect(() => {
    if (!movieId || typeof movieId !== 'string') return;

    // Record initial watch
    const recordWatch = async () => {
      try {
        await axios.post('/api/watch-history/update', {
          movieId: movieId,
          progress: 0
        });
      } catch (error) {
        console.error('Error recording watch start:', error);
      }
    };

    recordWatch();
    watchStartTimeRef.current = Date.now();

    // Update progress every 30 seconds
    progressIntervalRef.current = setInterval(async () => {
      const watchDuration = (Date.now() - watchStartTimeRef.current) / 1000; // seconds
      // Estimate progress based on watch time (rough estimate)
      // For a 2-hour movie, 30 seconds = ~0.4% progress
      const estimatedProgress = Math.min((watchDuration / 7200) * 100, 95); // Cap at 95%

      try {
        await axios.post('/api/watch-history/update', {
          movieId: movieId,
          progress: estimatedProgress
        });
      } catch (error) {
        console.error('Error updating watch progress:', error);
      }
    }, 30000); // Every 30 seconds

    // Cleanup on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [movieId]);

  useEffect(() => {
    if (data?.imdbId) {
      try {
        // Get all available streaming sources
        const streamSources = data.type === 'tv'
          ? streamingService.getTVShowStreamSources(data.imdbId, 1, 1, data.tmdbId)
          : streamingService.getMovieStreamSources(data.imdbId, data.tmdbId);

        setSources(streamSources);
        setCurrentSourceIndex(0);
        setIsLoading(false);
      } catch (err) {
        console.error('Error getting streaming sources:', err);
        setIsLoading(false);
      }
    }
  }, [data]);

  const handleSourceChange = (index: number) => {
    setCurrentSourceIndex(index);
  };

  if (!data || isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const currentSource = sources[currentSourceIndex];

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Back Button - Top Left */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-gray-700/50 hover:border-gray-600"
        title="Go Back"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="text-sm font-medium hidden md:inline">Back</span>
      </button>

      {/* Source Selector - Top Right (only if multiple sources) */}
      {sources.length > 1 && (
        <div className="absolute top-4 right-4 z-50">
          <select
            value={currentSourceIndex}
            onChange={(e) => handleSourceChange(parseInt(e.target.value))}
            className="bg-black/70 hover:bg-black/90 text-white text-sm px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 focus:outline-none focus:border-blue-500 transition-all backdrop-blur-sm cursor-pointer"
          >
            {sources.map((source, index) => (
              <option key={index} value={index}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* VidKing Player - Full Screen */}
      {currentSource && (
        <iframe
          key={currentSource.url}
          src={currentSource.url}
          className="w-full h-full"
          allowFullScreen
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin"
          title={data.title}
        />
      )}
    </div>
  );
};

export default Watch;
