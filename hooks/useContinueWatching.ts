import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useContinueWatching = () => {
    const { data, error, isLoading, mutate } = useSWR('/api/watch-history', fetcher, {
        revalidateIfStale: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateOnMount: true,
        dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    });

    return {
        data: data || [],
        error,
        isLoading,
        mutate
    }
};

export default useContinueWatching;
