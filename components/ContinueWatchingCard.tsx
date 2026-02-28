import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

interface ContinueWatchingCardProps {
    data: {
        id: string;
        title: string;
        thumbnailUrl: string;
        genre: string;
        duration: string;
        year?: string;
        progress: number;
    };
    onRemove?: (movieId: string) => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ data, onRemove }) => {
    const router = useRouter();
    const [isRemoving, setIsRemoving] = useState(false);

    const redirectToWatch = useCallback(() => router.push(`/watch/${data.id}`), [router, data.id]);

    const handleRemove = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click

        if (isRemoving) return;

        setIsRemoving(true);

        try {
            // Optimistically update the UI
            if (onRemove) {
                onRemove(data.id);
            }

            // Delete from server
            await axios.delete(`/api/watch-history/delete?movieId=${data.id}`);

            // Revalidate the SWR cache to ensure consistency
            await mutate('/api/watch-history');

            toast.success('Removed from Continue Watching');
        } catch (error) {
            console.error('Error removing from continue watching:', error);
            toast.error('Failed to remove. Please try again.');

            // Revalidate to restore the correct state on error
            await mutate('/api/watch-history');
            setIsRemoving(false);
        }
    }, [data.id, onRemove, isRemoving]);

    return (
        <div className="group relative h-full cursor-pointer" onClick={redirectToWatch}>
            {/* Main Card - Landscape 16:9 */}
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-zinc-800">
                <img
                    src={data.thumbnailUrl}
                    alt={data.title}
                    draggable={false}
                    className="object-cover w-full h-full transition-transform duration-300 md:group-hover:scale-110"
                />

                {/* Dark overlay on hover - Desktop only */}
                <div className="hidden md:block absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Remove button - top right - Desktop only */}
                <button
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="hidden md:flex absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 disabled:opacity-50"
                    title="Remove from Continue Watching"
                >
                    <XMarkIcon className="w-5 h-5 text-white" />
                </button>

                {/* Remove button - Mobile - Always visible */}
                <button
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="md:hidden absolute top-2 right-2 w-8 h-8 bg-black/70 active:bg-black/90 rounded-full flex items-center justify-center z-10 disabled:opacity-50"
                    title="Remove from Continue Watching"
                >
                    <XMarkIcon className="w-5 h-5 text-white" />
                </button>

                {/* Play button overlay - Desktop only */}
                <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <PlayIcon className="w-6 h-6 md:w-8 md:h-8 text-black ml-1" />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/80">
                    <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${data.progress}%` }}
                    />
                </div>
            </div>

            {/* Title below card */}
            <div className="mt-2">
                <h3 className="text-white text-sm font-semibold truncate md:group-hover:text-gray-300 transition-colors">
                    {data.title}
                </h3>
            </div>
        </div>
    );
}

export default ContinueWatchingCard;
