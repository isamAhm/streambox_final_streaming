import useSWR from 'swr';
import fetcher from '@/libs/fetcher';
import { handleApiError } from '@/libs/errorHandler';

const useSeries = () => {
    const { data, error, isLoading, mutate } = useSWR('/api/movies/series', fetcher, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        onError: (err) => {
            if (err?.response?.status !== 401) {
                handleApiError(err, 'Failed to load series');
            }
        },
    });
    return {
        data: data || [],
        error,
        isLoading,
        mutate
    }
};

export default useSeries;
