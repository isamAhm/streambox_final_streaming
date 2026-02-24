import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useSeriesByGenre = (genre: string) => {
    const { data, error, isLoading } = useSWR(
        genre ? `/api/movies/series-by-genre?genre=${encodeURIComponent(genre)}` : null,
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

export default useSeriesByGenre;
