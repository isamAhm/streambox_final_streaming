import React, { useCallback, useEffect, useRef, useState } from 'react';
import { XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import PlayButton from '@/components/PlayButton';
import WatchlistButton from '@/components/WatchlistButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useMovie from '@/hooks/useMovie';
import axios from 'axios';
import { useRouter } from 'next/router';

interface InfoModalProps {
  visible?: boolean;
  onClose: any;
}

const InfoModal: React.FC<InfoModalProps> = React.memo(({ visible, onClose }) => {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [trailerFetched, setTrailerFetched] = useState<string | null>(null);
  const { movieId } = useInfoModalStore();
  const { data = {}, isLoading } = useMovie(movieId);
  const router = useRouter();
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trailer fetch with sessionStorage cache
  useEffect(() => {
    if (visible && movieId && trailerFetched !== movieId) {
      setShowTrailer(false);
      setIsMuted(true);
      setTrailerFetched(movieId);

      const cacheKey = `trailer:${movieId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setTrailerUrl(cached);
        setTimeout(() => setShowTrailer(true), 500);
        return;
      }

      setTrailerUrl(null);
      axios.get(`/api/movies/trailer/${movieId}`)
        .then(response => {
          const url = response.data.trailerUrl;
          if (url) sessionStorage.setItem(cacheKey, url);
          setTrailerUrl(url);
          setTimeout(() => setShowTrailer(true), 500);
        })
        .catch(() => setTrailerUrl(null));
    }

    // Reset trailer state when modal closes
    if (!visible) {
      setShowTrailer(false);
      setTrailerUrl(null);
      setIsMuted(true);
    }
  }, [visible, movieId, trailerFetched]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleMute = useCallback(() => setIsMuted(m => !m), []);

  const getTrailerUrlWithMute = (url: string | null, muted: boolean) => {
    if (!url) return null;
    return url.replace(/mute=\d/, `mute=${muted ? '1' : '0'}`);
  };

  if (!visible) return null;

  const currentTrailerUrl = getTrailerUrlWithMute(trailerUrl, isMuted);

  return (
    <div className="z-50 bg-black/80 flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0">
      {/* Fixed width modal — prevents shape shifting as content loads */}
      <div className="relative w-[80vw] max-w-3xl mx-auto rounded-lg overflow-hidden glass-card border border-white/10 drop-shadow-2xl">

        {/* Media section — fixed height, never collapses */}
        <div className="relative h-96 bg-zinc-900 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-zinc-800" />
          ) : (
            <>
              {/* Backdrop / poster */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${showTrailer && currentTrailerUrl ? 'opacity-0' : 'opacity-100'}`}
                style={{
                  backgroundImage: `url(${(data as any)?.backdropUrl || data?.thumbnailUrl})`,
                  filter: 'brightness(55%)',
                }}
              />

              {/* Trailer iframe */}
              {currentTrailerUrl && (
                <div className={`absolute inset-0 transition-opacity duration-700 ${showTrailer ? 'opacity-100' : 'opacity-0'}`}>
                  <iframe
                    key={`trailer-${isMuted}`}
                    src={currentTrailerUrl}
                    className="w-full h-full pointer-events-none"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    title={`${data?.title} Trailer`}
                    style={{ pointerEvents: 'none', filter: 'brightness(60%)' }}
                  />
                  <div className="absolute inset-0 pointer-events-none" />
                </div>
              )}

              {/* Title + actions overlay */}
              <div className="absolute bottom-6 left-8 right-16 z-10">
                <p className="text-white text-2xl md:text-4xl font-bold mb-4 drop-shadow-xl line-clamp-2">
                  {data?.title}
                </p>
                <div className="flex flex-row gap-3 items-center flex-wrap">
                  <PlayButton movieId={data?.id} />
                  <WatchlistButton movieId={data?.id} movieTitle={data?.title} />
                  <button
                    onClick={() => { handleClose(); router.push(`/title/${data?.id}`); }}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-md transition border border-white/20"
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                    More Details
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition z-20"
          >
            <XMarkIcon className="text-white w-6" />
          </button>

          {/* Mute button */}
          {showTrailer && currentTrailerUrl && !isLoading && (
            <button
              onClick={toggleMute}
              className="absolute top-3 right-16 h-10 w-10 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition z-20"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted
                ? <SpeakerXMarkIcon className="text-white w-6" />
                : <SpeakerWaveIcon className="text-white w-6" />
              }
            </button>
          )}
        </div>

        {/* Info section — fixed min/max height with scroll for long descriptions */}
        <div className="px-8 py-6 min-h-[160px] max-h-[260px] overflow-y-auto scrollbar-modern">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="flex gap-3">
                {[16, 24, 20, 28].map(w => <div key={w} className={`h-5 w-${w} bg-zinc-700 rounded`} />)}
              </div>
              <div className="space-y-2 mt-2">
                <div className="h-4 w-full bg-zinc-700 rounded" />
                <div className="h-4 w-full bg-zinc-700 rounded" />
                <div className="h-4 w-3/4 bg-zinc-700 rounded" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                {data?.year && <span className="text-green-400 font-semibold">{data.year}</span>}
                {data?.duration && <span className="text-white">{data.duration}</span>}
                {data?.rating && (
                  <span className="text-white flex items-center gap-1">
                    <span className="text-yellow-400">★</span> {(data.rating as number).toFixed(1)}
                  </span>
                )}
                {data?.genre && <span className="text-zinc-400">{data.genre}</span>}
              </div>
              <p className="text-white text-sm leading-relaxed">{data?.description}</p>
            </>
          )}
        </div>

      </div>
    </div>
  );
});

InfoModal.displayName = 'InfoModal';

export default InfoModal;
