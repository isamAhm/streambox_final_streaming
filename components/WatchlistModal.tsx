import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface WatchlistModalProps {
    visible: boolean;
    onClose: () => void;
    movieId: string;
    movieTitle: string;
    currentStatus?: string | null;
    isFavorite?: boolean;
    onSuccess?: () => void;
}

const WatchlistModal: React.FC<WatchlistModalProps> = ({
    visible,
    onClose,
    movieId,
    movieTitle,
    currentStatus,
    isFavorite,
    onSuccess,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!visible) return null;

    const statuses = [
        { value: 'watching', label: 'Watching' },
        { value: 'plan_to_watch', label: 'Plan to Watch' },
        { value: 'completed', label: 'Completed' },
    ];

    // Determine which status is currently active
    const getCurrentStatus = () => {
        if (isFavorite) return 'plan_to_watch';
        if (currentStatus) return currentStatus;
        return null;
    };

    const activeStatus = getCurrentStatus();

    const handleSelect = async (status: string) => {
        setIsSubmitting(true);
        try {
            // If clicking the same status, remove from list
            if (status === activeStatus) {
                if (status === 'plan_to_watch') {
                    // Remove from favorites
                    await axios.delete('/api/favorite', { data: { movieId } });
                    toast.success('Removed from My List');
                } else {
                    // Remove from watchlist
                    await axios.delete(`/api/watchlist/remove?movieId=${movieId}`);
                    toast.success('Removed from My List');
                }
            } else {
                // Switching to a different list or adding new
                // First, remove from current list if exists
                if (activeStatus === 'plan_to_watch') {
                    await axios.delete('/api/favorite', { data: { movieId } });
                } else if (activeStatus) {
                    await axios.delete(`/api/watchlist/remove?movieId=${movieId}`);
                }

                // Then add to new list
                if (status === 'plan_to_watch') {
                    await axios.post('/api/favorite', { movieId });
                    toast.success('Added to Plan to Watch');
                } else {
                    await axios.post('/api/watchlist', {
                        movieId,
                        status,
                    });
                    toast.success(`Added to ${statuses.find(s => s.value === status)?.label}`);
                }
            }

            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Error updating list:', error);
            toast.error(error.response?.data?.error || 'Failed to update list');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-black bg-opacity-90 rounded-lg p-3 min-w-[160px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-2">
                    {statuses.map((status) => {
                        const isActive = status.value === activeStatus;
                        return (
                            <button
                                key={status.value}
                                onClick={() => handleSelect(status.value)}
                                disabled={isSubmitting}
                                className={`w-full text-center text-base py-2 rounded transition-colors disabled:opacity-50 ${isActive
                                    ? 'border-2 shadow-sm shadow-blue-500 border-blue-600 text-white hover:border-blue-700'
                                    : 'text-white hover:bg-zinc-800'
                                    }`}
                            >
                                {status.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WatchlistModal;
