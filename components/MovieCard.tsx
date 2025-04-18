import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { MovieInterface } from '@/types';
import FavoriteButton from '@/components/FavoriteButton';
import useInfoModalStore from '@/hooks/useInfoModalStore';

interface MovieCardProps {
  data: MovieInterface;
}

const MovieCard: React.FC<MovieCardProps> = ({ data }) => {
  const router = useRouter();
  const { openModal } = useInfoModalStore();

  const redirectToWatch = useCallback(() => router.push(`/watch/${data.id}`), [router, data.id]);

  return (
    <div className="group col-span relative h-[12vw]">
      <img 
        onClick={() => openModal(data?.id)} 
        src={data.thumbnailUrl} 
        alt="Movie" 
        draggable={false} 
        className="
          cursor-pointer
          object-cover
          transition
          duration-200
          shadow-xl
          rounded-md
          group-hover:opacity-90
          lg:group-hover:opacity-0
          delay-200
          w-full
          h-[12vw]
          flex-shrink-0
        " 
      />
      <p className='
          cursor-pointer
          text-white
          transition
          duration-200
          font-semibold
          rounded-md
          group-hover:opacity-90
          lg:group-hover:opacity-0
          delay-200
          w-full
          flex-shrink-0
          '>{data.title}</p>
      <div className="
        opacity-0
        absolute
        top-0
        transition
        duration-200
        z-10
        invisible
        lg:visible
        delay-200
        w-full
        scale-0
        backdrop-blur-md
        group-hover:scale-110
        group-hover:-translate-y-[6vw]
        group-hover:translate-x-[2vw]
        group-hover:opacity-100
      ">
        <img 
          onClick={redirectToWatch} 
          src={data.thumbnailUrl} 
          alt="Movie" 
          draggable={false} 
          className="
            cursor-pointer
            object-cover
            transition
            duration-200
            shadow-xl
            rounded-t-md
            w-full
            h-[12vw]
            flex-shrink-0
            border 
        border-[#ffffff2e]
          " 
        />
        <div className="
          border 
        border-[#ffffff2e]
          z-10
          glass-card
          p-2
          lg:p-4
          absolute
          w-full
          transition
          shadow-md
          rounded-b-md
        ">
          <div className="flex flex-row items-center gap-3">
            <div 
              onClick={redirectToWatch} 
              className="cursor-pointer w-6 h-6 lg:w-10 lg:h-10 bg-white rounded-full flex justify-center items-center transition hover:bg-neutral-300"
            >
              <PlayIcon className="text-black w-4 lg:w-6" />
            </div>
            <FavoriteButton movieId={data.id} />
            <div 
              onClick={() => openModal(data?.id)} 
              className="cursor-pointer ml-auto group/item w-6 h-6 lg:w-10 lg:h-10 border-white border-2 rounded-full flex justify-center items-center transition hover:border-neutral-300"
            >
              <ChevronDownIcon className="text-white group-hover/item:text-neutral-300 w-4 lg:w-6" />
            </div>
          </div>
          <p className="text-green-400 font-semibold mt-4">
            New <span className="text-white">2023</span>
          </p>
          <div className="flex flex-row mt-4 gap-2 items-center"> 
            <p className="text-white text-[10px] lg:text-sm">{data.duration}</p>
          </div>
          <div className="flex flex-row items-center gap-2 mt-4 text-[8px] text-white lg:text-sm">
            <p>{data.genre}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieCard;