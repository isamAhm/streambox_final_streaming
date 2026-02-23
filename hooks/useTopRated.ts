import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useTopRated = () => {
    const { data, error, isLoading } = useSWR('/api/movies/top-rated', fetcher, {
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

export default useTopRated;
