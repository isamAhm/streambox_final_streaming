import React, { useCallback, useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import PlayButton from '@/components/PlayButton';
import useBillboard from '@/hooks/useBillboard';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import axios from 'axios';

const Billboard = React.memo(() => {
  const { openModal } = useInfoModalStore();
  const { data } = useBillboard();
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerFetchedId, setTrailerFetchedId] = useState<string | null>(null);

  const handleOpenModal = useCallback(() => {
    openModal(data?.id);
  }, [openModal, data?.id]);

  // Re-fetch trailer whenever the billboard movie changes, with sessionStorage cache
  useEffect(() => {
    if (!data?.id || data.id === trailerFetchedId) return;

    setShowTrailer(false);
    setTrailerFetchedId(data.id);

    // Check sessionStorage first — avoids redundant TMDB calls during navigation
    const cacheKey = `trailer:${data.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setTrailerUrl(cached);
      setTimeout(() => setShowTrailer(true), 500);
      return;
    }

    setTrailerUrl(null);
    axios.get(`/api/movies/trailer/${data.id}`)
      .then(response => {
        const url = response.data.trailerUrl;
        if (url) sessionStorage.setItem(cacheKey, url);
        setTrailerUrl(url);
        setTimeout(() => setShowTrailer(true), 500);
      })
      .catch(() => setTrailerUrl(null));
  }, [data?.id]);

  return (
    <div className="relative h-[56.25vw]">
      {/* Backdrop Image — wide landscape, high quality. Falls back to poster if no backdrop */}
      <div
        className={`absolute inset-0 w-full h-[56.25vw] bg-cover bg-center transition-opacity duration-1000 ${showTrailer && trailerUrl ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `url(${data?.backdropUrl || data?.thumbnailUrl})`,
          backgroundPosition: 'center top',
          filter: 'brightness(55%)',
        }}
      />

      {/* YouTube Trailer - Fades in when loaded */}
      {trailerUrl && (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${showTrailer ? 'opacity-100' : 'opacity-0'}`}>
          <iframe
            src={trailerUrl}
            className="w-full h-[56.25vw] object-cover brightness-[60%] pointer-events-none"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            title={`${data?.title} Trailer`}
            style={{ pointerEvents: 'none' }}
          />
          {/* Overlay to block YouTube interactions */}
          <div className="absolute inset-0 pointer-events-none" />
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute top-[30%] md:top-[40%] ml-4 md:ml-16 z-10">
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
});

Billboard.displayName = 'Billboard';

export default Billboard;
