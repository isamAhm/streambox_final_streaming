import { useState, useEffect } from 'react';
import { useGuestMode } from '@/contexts/GuestModeContext';

interface GuestWatchItem {
    movieId: string;
    progress: number;
    lastWatched: string;
    movieTitle?: string;
    movieImage?: string;
}

const useGuestContinueWatching = () => {
    const { isGuestMode } = useGuestMode();
    const [guestData, setGuestData] = useState<GuestWatchItem[]>([]);

    // Load guest watch history from sessionStorage
    useEffect(() => {
        if (isGuestMode) {
            const stored = sessionStorage.getItem('guest-continue-watching');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setGuestData(Array.isArray(parsed) ? parsed : []);
                } catch {
                    setGuestData([]);
                }
            }
        }
    }, [isGuestMode]);

    const addGuestWatchItem = (item: GuestWatchItem) => {
        if (!isGuestMode) return;

        setGuestData(prev => {
            // Remove existing entry for this movie
            const filtered = prev.filter(i => i.movieId !== item.movieId);
            // Add new entry at the beginning
            const newData = [item, ...filtered].slice(0, 10); // Keep only last 10 items

            // Save to sessionStorage
            sessionStorage.setItem('guest-continue-watching', JSON.stringify(newData));
            return newData;
        });
    };

    const removeGuestWatchItem = (movieId: string) => {
        if (!isGuestMode) return;

        setGuestData(prev => {
            const filtered = prev.filter(i => i.movieId !== movieId);
            sessionStorage.setItem('guest-continue-watching', JSON.stringify(filtered));
            return filtered;
        });
    };

    const clearGuestWatchHistory = () => {
        if (!isGuestMode) return;

        setGuestData([]);
        sessionStorage.removeItem('guest-continue-watching');
    };

    return {
        guestData: isGuestMode ? guestData : [],
        addGuestWatchItem,
        removeGuestWatchItem,
        clearGuestWatchHistory,
        isGuestMode
    };
};

export default useGuestContinueWatching;