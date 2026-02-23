import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useSeries = () => {
    const { data, error, isLoading } = useSWR('/api/movies/series', fetcher, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });
    return {
        data,
        error,
        isLoading
    }
};

export default useSeries;
