// hooks/useHlsPlayer.ts
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export const useHlsPlayer = (url: string) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls>();

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !url) return;

    const isHLS = url.includes('.m3u8');
    let hls: Hls | null = null;

    const initializePlayer = async () => {
      try {
        if (isHLS) {
          if (Hls.isSupported()) {
            hls = new Hls();
            hlsRef.current = hls;
            
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              hls!.loadSource(url);
            });
          } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support for Safari
            videoElement.src = url;
          }
        } else {
          // Direct MP4 playback
          videoElement.src = url;
          await videoElement.play();
        }
      } catch (error) {
        console.error('Error initializing player:', error);
      }
    };

    initializePlayer();

    return () => {
      // Cleanup HLS instance
      if (hls) {
        hls.destroy();
        hlsRef.current = undefined;
      }
      
      // Reset video element
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute('src');
        videoElement.load();
      }
    };
  }, [url]);

  return videoRef;
};