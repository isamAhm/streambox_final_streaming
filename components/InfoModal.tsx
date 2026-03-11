import React, { useCallback, useEffect, useState } from 'react';
import { XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import PlayButton from '@/components/PlayButton';
import WatchlistButton from '@/components/WatchlistButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useMovie from '@/hooks/useMovie';
import axios from 'axios';

interface InfoModalProps {
  visible?: boolean;
  onClose: any;
}

const InfoModal: React.FC<InfoModalProps> = React.memo(({ visible, onClose }) => {
  const [isVisible, setIsVisible] = useState<boolean>(!!visible);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [trailerFetched, setTrailerFetched] = useState<string | null>(null);
  const { movieId } = useInfoModalStore();
  const { data = {}, isLoading } = useMovie(movieId);

  useEffect(() => {
    setIsVisible(!!visible);

    // Fetch trailer when modal opens (only once per movie)
    if (visible && movieId && trailerFetched !== movieId) {
      setShowTrailer(false);
      setTrailerUrl(null);
      setIsMuted(true);
      setTrailerFetched(movieId);

      axios.get(`/api/movies/trailer/${movieId}`)
        .then(response => {
          setTrailerUrl(response.data.trailerUrl);
          setTimeout(() => setShowTrailer(true), 500);
        })
        .catch(error => {
          console.log('No trailer available:', error);
          setTrailerUrl(null);
        });
    }
  }, [visible, movieId, trailerFetched]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTrailerUrl(null);
    setShowTrailer(false);
    setIsMuted(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Generate trailer URL with mute parameter
  const getTrailerUrlWithMute = (url: string | null, muted: boolean) => {
    if (!url) return null;
    return url.replace(/mute=\d/, `mute=${muted ? '1' : '0'}`);
  };

  if (!visible) {
    return null;
  }

  const currentTrailerUrl = getTrailerUrlWithMute(trailerUrl, isMuted);

  return (
    <div className="z-50 transition duration-300 bg-black bg-opacity-80 flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0">
      <div className="relative w-auto mx-auto max-w-3xl rounded-md overflow-hidden">
        <div className={`${isVisible ? 'scale-100' : 'scale-0'} transform duration-300 relative flex-auto glass-card rounded-lg border border-[#ffffff2e] drop-shadow-md w-full`}>

          {/* Fixed height container to prevent layout shift */}
          <div className="relative h-96 bg-zinc-900">
            {isLoading ? (
              /* Loading Skeleton */
              <div className="absolute inset-0 animate-pulse">
                <div className="w-full h-full bg-zinc-800" />
                <div className="absolute bottom-[10%] left-10 z-10 space-y-4">
                  <div className="h-12 w-64 bg-zinc-700 rounded" />
                  <div className="flex gap-4">
                    <div className="h-12 w-32 bg-zinc-700 rounded" />
                    <div className="h-12 w-12 bg-zinc-700 rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Poster Image - Always shown first, then fades when trailer loads */}
                <div
                  className={`absolute inset-0 w-full h-full object-cover brightness-[60%] bg-cover bg-center rounded-t-lg transition-opacity duration-1000 ${showTrailer && currentTrailerUrl ? 'opacity-0' : 'opacity-100'
                    }`}
                  style={{ backgroundImage: `url(${data?.thumbnailUrl})` }}
                />

                {/* YouTube Trailer - Fades in when loaded */}
                {currentTrailerUrl && (
                  <div className={`absolute inset-0 transition-opacity duration-1000 ${showTrailer ? 'opacity-100' : 'opacity-0'}`}>
                    <iframe
                      key={`trailer-${isMuted}`}
                      src={currentTrailerUrl}
                      className="w-full h-full object-cover brightness-[60%] rounded-t-lg pointer-events-none"
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      title={`${data?.title} Trailer`}
                      style={{ pointerEvents: 'none' }}
                    />
                    <div className="absolute inset-0 pointer-events-none" />
                  </div>
                )}

                {/* Content Overlay */}
                <div className="absolute bottom-[10%] left-10 z-10">
                  <p className="text-white text-3xl md:text-4xl h-full lg:text-5xl font-bold mb-8 drop-shadow-xl">
                    {data?.title}
                  </p>
                  <div className="flex flex-row gap-4 items-center">
                    <PlayButton movieId={data?.id} />
                    <WatchlistButton movieId={data?.id} movieTitle={data?.title} />
                  </div>
                </div>
              </>
            )}

            {/* Close Button - Always visible */}
            <div
              onClick={handleClose}
              className="cursor-pointer absolute top-3 right-3 h-10 w-10 rounded-full bg-black bg-opacity-70 flex items-center justify-center hover:bg-opacity-90 transition z-10"
            >
              <XMarkIcon className="text-white w-6" />
            </div>

            {/* Mute/Unmute Button - Only shows when trailer is playing */}
            {showTrailer && currentTrailerUrl && !isLoading && (
              <button
                onClick={toggleMute}
                className="absolute top-3 right-16 h-10 w-10 rounded-full bg-black bg-opacity-70 flex items-center justify-center hover:bg-opacity-90 transition z-10 cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="text-white w-6" />
                ) : (
                  <SpeakerWaveIcon className="text-white w-6" />
                )}
              </button>
            )}
          </div>

          {/* Fixed height content section to prevent layout shift */}
          <div className="px-12 py-8 min-h-[200px]">
            {isLoading ? (
              /* Loading Skeleton for content */
              <div className="animate-pulse space-y-4">
                <div className="flex gap-4">
                  <div className="h-6 w-16 bg-zinc-700 rounded" />
                  <div className="h-6 w-24 bg-zinc-700 rounded" />
                  <div className="h-6 w-20 bg-zinc-700 rounded" />
                  <div className="h-6 w-28 bg-zinc-700 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-zinc-700 rounded" />
                  <div className="h-4 w-full bg-zinc-700 rounded" />
                  <div className="h-4 w-3/4 bg-zinc-700 rounded" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-row items-center gap-2 mb-8">
                  <p className="text-green-400 font-semibold text-lg">
                    {data?.year}
                  </p>
                  <p className="text-white text-lg">
                    {data?.duration}
                  </p>
                  {data?.rating && (
                    <p className="text-white text-lg flex items-center gap-1">
                      <span className="text-yellow-400">★</span> {data.rating.toFixed(1)}
                    </p>
                  )}
                  <p className="text-white text-lg">
                    {data?.genre}
                  </p>
                </div>
                <p className="text-white text-lg">
                  {data?.description}
                </p>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
});

InfoModal.displayName = 'InfoModal';

export default InfoModal;
