import React, { useState, useCallback, useMemo } from 'react';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import WatchlistModal from './WatchlistModal';
import useWatchlist from '@/hooks/useWatchlist';
import useFavorites from '@/hooks/useFavorites';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useAuth } from '@clerk/nextjs';
import { useGuestMode } from '@/contexts/GuestModeContext';
import GuestPrompt from './GuestPrompt';
import axios from 'axios';
import toast from 'react-hot-toast';

interface WatchlistButtonProps {
    movieId: string;
    movieTitle: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ movieId, movieTitle }) => {
    const [showModal, setShowModal] = useState(false);
    const [showGuestPrompt, setShowGuestPrompt] = useState(false);
    const { isSignedIn } = useAuth();
    const { isGuestMode } = useGuestMode();
    const { data: watchlistItems = [], mutate: mutateWatchlist } = useWatchlist();
    const { data: watchingItems = [], mutate: mutateWatching } = useWatchlist('watching');
    const { data: completedItems = [], mutate: mutateCompleted } = useWatchlist('completed');
    const { mutate: mutateFavorites } = useFavorites();
    const { data: currentUser, mutate: mutateUser } = useCurrentUser();

    // Check if movie is in watchlist (Watching or Completed)
    const watchlistItem = watchlistItems?.find((item: any) => item.id === movieId);

    // Check if movie is in favorites (Plan to Watch)
    const isFavorite = useMemo(() => {
        const list = currentUser?.favoriteIds || [];
        return list.includes(movieId);
    }, [currentUser, movieId]);

    const isInAnyList = !!watchlistItem || isFavorite;

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        // Check if user is guest or not signed in
        if (!isSignedIn || isGuestMode) {
            setShowGuestPrompt(true);
            return;
        }

        // Show modal for authenticated users
        setShowModal(true);
    }, [isSignedIn, isGuestMode]);

    const handleRemove = async () => {
        try {
            if (watchlistItem) {
                // Remove from watchlist
                await axios.delete(`/api/watchlist/remove?movieId=${movieId}`);
                mutateWatchlist();
                mutateWatching();
                mutateCompleted();
            }

            if (isFavorite) {
                // Remove from favorites
                const response = await axios.delete('/api/favorite', { data: { movieId } });
                const updatedFavoriteIds = response?.data?.favoriteIds;
                mutateUser({
                    ...currentUser,
                    favoriteIds: updatedFavoriteIds,
                });
                mutateFavorites();
            }

            toast.success('Removed from My List');
        } catch (error) {
            console.error('Error removing from list:', error);
            toast.error('Failed to remove from list');
        }
    };

    const handleSuccess = () => {
        mutateWatchlist();
        mutateWatching();
        mutateCompleted();
        mutateFavorites();
        mutateUser();
    };

    const Icon = isInAnyList ? CheckIcon : PlusIcon;

    return (
        <>
            <div
                onClick={handleClick}
                className="cursor-pointer group/item w-6 h-6 lg:w-10 lg:h-10 border-white border-2 rounded-full flex justify-center items-center transition hover:border-neutral-300"
                title={isInAnyList ? 'Remove from My List' : 'Add to My List'}
            >
                <Icon className="text-white group-hover/item:text-neutral-300 w-4 lg:w-6" />
            </div>

            {showGuestPrompt && (
                <GuestPrompt
                    feature="Watchlist"
                    message="Sign up to save movies and shows to your watchlist"
                    onClose={() => setShowGuestPrompt(false)}
                />
            )}

            <WatchlistModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                movieId={movieId}
                movieTitle={movieTitle}
                currentStatus={watchlistItem?.watchlistStatus}
                isFavorite={isFavorite}
                onSuccess={handleSuccess}
            />
        </>
    );
};

export default WatchlistButton;
