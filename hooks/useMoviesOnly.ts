import useSWR from 'swr';
import fetcher from '@/libs/fetcher';
import { handleApiError } from '@/libs/errorHandler';

const useMoviesOnly = () => {
    const { data, error, isLoading, mutate } = useSWR('/api/movies/movies-only', fetcher, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        onError: (err) => handleApiError(err, 'Failed to load movies'),
    });
    return {
        data,
        error,
        isLoading,
        mutate
    }
};

export default useMoviesOnly;
