import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useContinueWatching = () => {
    const { data, error, isLoading, mutate } = useSWR('/api/watch-history', fetcher, {
        revalidateIfStale: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
    });

    return {
        data: data || [],
        error,
        isLoading,
        mutate
    }
};

export default useContinueWatching;
