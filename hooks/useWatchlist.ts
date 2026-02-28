import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useWatchlist = (status?: string) => {
    const url = status ? `/api/watchlist?status=${status}` : '/api/watchlist';

    const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
        revalidateOnFocus: true,
        revalidateOnMount: true,
        dedupingInterval: 1000,
    });

    return {
        data: data || [],
        error,
        isLoading,
        mutate,
    };
};

export default useWatchlist;
