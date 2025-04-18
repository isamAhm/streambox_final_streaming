import React, { useCallback, useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Hls from 'hls.js';
import PlayButton from '@/components/PlayButton';
import FavoriteButton from '@/components/FavoriteButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useMovie from '@/hooks/useMovie';

interface InfoModalProps {
  visible?: boolean;
  onClose: any;
}

const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose }) => {
  const [isVisible, setIsVisible] = useState<boolean>(!!visible);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls>();
  const { movieId } = useInfoModalStore();
  const { data = {} } = useMovie(movieId);

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  useEffect(() => {
    if (!data?.videoUrl || !videoRef.current) return;

    const isHLS = data.videoUrl.includes('.m3u8');
    
    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (isHLS) {
      if (Hls.isSupported()) {
        hlsRef.current = new Hls();
        hlsRef.current.attachMedia(videoRef.current);
        hlsRef.current.loadSource(data.videoUrl);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support in Safari
        videoRef.current.src = data.videoUrl;
      }
    } else {
      // Regular MP4 playback
      videoRef.current.src = data.videoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [data?.videoUrl]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="z-50 transition duration-300 bg-black bg-opacity-80 flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0">
      <div className="relative w-auto mx-auto max-w-3xl rounded-md overflow-hidden">
        <div className={`${isVisible ? 'scale-100' : 'scale-0'} transform duration-300 relative flex-auto glass-card rounded-lg border border-[#ffffff2e] drop-shadow-md`}>

          <div className="relative h-96">
            <video
              ref={videoRef}
              poster={data?.thumbnailUrl}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="w-full brightness-[60%] object-cover h-full rounded-t-lg"
            />
            <div onClick={handleClose} className="cursor-pointer absolute top-3 right-3 h-10 w-10 rounded-full bg-black bg-opacity-70 flex items-center justify-center">
              <XMarkIcon className="text-white w-6" />
            </div>
            <div className="absolute bottom-[10%] left-10">
              <p className="text-white text-3xl md:text-4xl h-full lg:text-5xl font-bold mb-8">
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
                New
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