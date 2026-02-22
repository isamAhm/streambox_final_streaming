import React, { useCallback, useEffect, useState } from 'react';
import { XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import PlayButton from '@/components/PlayButton';
import FavoriteButton from '@/components/FavoriteButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useMovie from '@/hooks/useMovie';
import axios from 'axios';

interface InfoModalProps {
  visible?: boolean;
  onClose: any;
}

const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose }) => {
  const [isVisible, setIsVisible] = useState<boolean>(!!visible);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { movieId } = useInfoModalStore();
  const { data = {} } = useMovie(movieId);

  useEffect(() => {
    setIsVisible(!!visible);

    // Fetch trailer when modal opens
    if (visible && movieId) {
      setShowTrailer(false);
      setTrailerUrl(null);
      setIsMuted(true); // Reset to muted when modal opens

      axios.get(`/api/movies/trailer/${movieId}`)
        .then(response => {
          setTrailerUrl(response.data.trailerUrl);
          // Small delay to ensure smooth transition
          setTimeout(() => setShowTrailer(true), 500);
        })
        .catch(error => {
          console.log('No trailer available:', error);
          setTrailerUrl(null);
        });
    }
  }, [visible, movieId]);

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
        <div className={`${isVisible ? 'scale-100' : 'scale-0'} transform duration-300 relative flex-auto glass-card rounded-lg border border-[#ffffff2e] drop-shadow-md`}>

          <div className="relative h-96">
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
                  key={`trailer-${isMuted}`} // Force reload when mute changes
                  src={currentTrailerUrl}
                  className="w-full h-full object-cover brightness-[60%] rounded-t-lg pointer-events-none"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  title={`${data?.title} Trailer`}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Overlay to block YouTube interactions */}
                <div className="absolute inset-0 pointer-events-none" />
              </div>
            )}

            {/* Close Button */}
            <div
              onClick={handleClose}
              className="cursor-pointer absolute top-3 right-3 h-10 w-10 rounded-full bg-black bg-opacity-70 flex items-center justify-center hover:bg-opacity-90 transition z-10"
            >
              <XMarkIcon className="text-white w-6" />
            </div>

            {/* Mute/Unmute Button - Only shows when trailer is playing */}
            {showTrailer && currentTrailerUrl && (
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

            {/* Content Overlay */}
            <div className="absolute bottom-[10%] left-10 z-10">
              <p className="text-white text-3xl md:text-4xl h-full lg:text-5xl font-bold mb-8 drop-shadow-xl">
                {data?.title}
              </p>
              <div className="flex flex-row gap-4 items-center">
                <PlayButton movieId={data?.id} />
                <FavoriteButton movieId={data?.id} />
              </div>
            </div>
          </div>

          <div className="px-12 py-8">
            <div className="flex flex-row items-center gap-2 mb-8">
              <p className="text-green-400 font-semibold text-lg">
                {data?.year}
              </p>
              <p className="text-white text-lg">
                {data?.duration}
              </p>
              <p className="text-white text-lg">
                {data?.genre}
              </p>
            </div>
            <p className="text-white text-lg">
              {data?.description}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default InfoModal;
