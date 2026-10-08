import { useCallback } from 'react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import useGuestContinueWatching from '@/hooks/useGuestContinueWatching';
import axios from 'axios';

interface UpdateProgressParams {
    movieId: string;
    progress: number;
    movieTitle?: string;
    movieImage?: string;
}

const useWatchProgress = () => {
    const { isGuestMode } = useGuestMode();
    const { addGuestWatchItem } = useGuestContinueWatching();

    const updateWatchProgress = useCallback(async ({
        movieId,
        progress,
        movieTitle,
        movieImage
    }: UpdateProgressParams) => {
        try {
            if (isGuestMode) {
                // Store in guest mode (sessionStorage)
                if (progress > 5) { // Only track if watched for at least 5%
                    addGuestWatchItem({
                        movieId,
                        progress,
                        lastWatched: new Date().toISOString(),
                        movieTitle,
                        movieImage
                    });
                }
                return { success: true };
            } else {
                // Store in database for authenticated users
                const response = await axios.post('/api/watch-history/update', {
                    movieId,
                    progress
                });
                return { success: true, data: response.data };
            }
        } catch (error) {
            console.error('Failed to update watch progress:', error);
            return { success: false, error };
        }
    }, [isGuestMode, addGuestWatchItem]);

    return {
        updateWatchProgress,
        isGuestMode
    };
};

export default useWatchProgress;