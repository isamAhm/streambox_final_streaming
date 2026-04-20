import useSwr from 'swr';
import fetcher from '@/libs/fetcher';

const useTrending = () => {
    const { data, error, isLoading } = useSwr('/api/movies/trending', fetcher, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
    });
    return { data: data || [], error, isLoading };
};

export default useTrending;
