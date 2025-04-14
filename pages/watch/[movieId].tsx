import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import useMovie from '@/hooks/useMovie';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';

const Watch = () => {
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);
  const videoRef = useHlsPlayer(data?.videoUrl || '');

  return (
    <div className="h-screen w-screen bg-black">
      <nav className="fixed w-full p-4 z-10 flex flex-row items-center gap-8 bg-black bg-opacity-70">
        <ArrowLeftIcon
          onClick={() => router.push('/')}
          className="w-4 md:w-10 text-white cursor-pointer hover:opacity-80 transition"
        />
        <p className="text-white text-1xl md:text-3xl font-bold">
          <span className="font-light">Watching:</span> {data?.title}
        </p>
      </nav>

      <video
        key={data?.videoUrl} // Force re-mount on URL change
        ref={videoRef}
        autoPlay
        controls
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
        onError={(e) => console.error('Video error:', e.currentTarget.error)}
        onCanPlay={() => console.log('Video ready to play')}
      />
    </div>
  );
};

export default Watch;