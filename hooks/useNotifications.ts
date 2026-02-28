import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

const useNotifications = () => {
    const { data, error, isLoading, mutate } = useSWR('/api/notifications', fetcher, {
        refreshInterval: 30000, // Refresh every 30 seconds
        revalidateOnFocus: true,
    });

    return {
        notifications: data || [],
        error,
        isLoading,
        mutate,
        unreadCount: data ? data.filter((n: any) => !n.read).length : 0,
    };
};

export default useNotifications;
