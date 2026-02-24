import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useMoviesByGenre = (genre: string) => {
    const { data, error, isLoading } = useSWR(
        genre ? `/api/movies/movies-by-genre?genre=${encodeURIComponent(genre)}` : null,
        fetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    return {
        data,
        error,
        isLoading
    }
};

export default useMoviesByGenre;
