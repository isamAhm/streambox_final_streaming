import React, { useEffect, useState } from 'react';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';

import Navbar from '@/components/Navbar';
import Billboard from '@/components/Billboard';
import MovieList from '@/components/MovieList';
import InfoModal from '@/components/InfoModal';
import useMovieList from '@/hooks/useMovieList';
import useFavorites from '@/hooks/useFavorites';
import useInfoModalStore from '@/hooks/useInfoModalStore';
import { LoadingAnimation } from '@/components/loading-animation';

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/home',
        permanent: false,
      }
    }
  }

  return {
    props: {}
  }
}

const Home = () => {
  const { data: movies = [] } = useMovieList();
  const { data: favorites = [] } = useFavorites();
  const {isOpen, closeModal} = useInfoModalStore();
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   // Simulate loading time (remove in production)
  //   const timer = setTimeout(() => {
  //     setIsLoading(false);
  //   }, 2000);
    
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {isLoading ? (
        <LoadingAnimation />
      ) : (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <Billboard />
      <div className="pb-40">
        <MovieList title="Trending Now" data={movies} />
        <div className="mt-4 md:mt-8">
          <h1 className='lg:pt-7 px-4 md:px-12 mt-12 md:-mb-12 max-md:-mb-20 text-white text-lg md:text-xl lg:text-2xl font-semibold'>
            My List
          </h1>
          <MovieList title="" data={favorites} horizontal />
        </div>
      </div>
    </>
          )}
    </div>
  )
}

export default Home;
