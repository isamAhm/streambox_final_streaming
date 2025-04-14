import InfoModal from '@/components/InfoModal';
import MovieList from '@/components/MovieList';
import Navbar from '@/components/Navbar';
import useFavorites from '@/hooks/useFavorites';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import useMovieList from '@/hooks/useMovieList';
import React from 'react'

const MyList = () => {
    const { data: movies = [] } = useMovieList();
    const { data: favorites = [] } = useFavorites();
    const { isOpen, closeModal } = useInfoModalStore();
  
    return (
      <div className="relative">
          <Navbar />
          <div className='px-4 md:px-16 mt-4 space-y-8'>
              <h1 className="pt-32 text-white text-md md:text-xl lg:text-2xl font-semibold mb-4">
                  My List
              </h1>
          </div>
          <InfoModal visible={isOpen} onClose={closeModal} />
          <div className="pb-40 md:pt-8">
              {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-gray-400 text-2xl text-center mt-20">
                          Your list is empty. Start adding movies and shows to watch later!
                      </p>
                  </div>
              ) : (
                  <MovieList title=" " data={favorites} />
              )}
          </div>
      </div>
    )
}

export default MyList;