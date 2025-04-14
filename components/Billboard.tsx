import React, { useCallback, useEffect, useRef } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Hls from 'hls.js';
import PlayButton from '@/components/PlayButton';
import useBillboard from '@/hooks/useBillboard';
import useInfoModalStore from '@/hooks/useInfoModalStore';

const Billboard: React.FC = () => {
  const { openModal } = useInfoModalStore();
  const { data } = useBillboard();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls>();

  const handleOpenModal = useCallback(() => {
    openModal(data?.id);
  }, [openModal, data?.id]);

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

  return (
    <div className="relative h-[56.25vw]">
      <video
        ref={videoRef}
        poster={data?.thumbnailUrl}
        className="w-full h-[56.25vw] object-cover brightness-[60%] transition duration-500"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="absolute top-[30%] md:top-[40%] ml-4 md:ml-16">
        <p className="text-white text-1xl md:text-5xl h-full w-[50%] lg:text-6xl font-bold drop-shadow-xl">
          {data?.title}
        </p>
        <p className="text-white text-[8px] md:text-lg mt-3 md:mt-8 w-[90%] md:w-[80%] lg:w-[50%] drop-shadow-xl">
          {data?.description}
        </p>
        <div className="flex flex-row items-center mt-3 md:mt-4 gap-3">
          <PlayButton movieId={data?.id} />
          <button
            onClick={handleOpenModal}
            className="
              bg-white
              text-white
              bg-opacity-30 
              rounded-md 
              py-1 md:py-2 
              px-2 md:px-4
              w-auto 
              text-xs lg:text-lg 
              font-semibold
              flex
              flex-row
              items-center
              hover:bg-opacity-20
              transition
            "
          >
            <InformationCircleIcon className="w-4 md:w-7 mr-1" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billboard;