import useSwr from 'swr'
import fetcher from '@/libs/fetcher';

const useBillboard = () => {
  const { data, error, isLoading } = useSwr('/api/random', fetcher, {
    revalidateIfStale: false,   // keep same movie for the whole session
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: true,    // fetch once on first mount only
  });
  return { data, error, isLoading };
};

export default useBillboard;
