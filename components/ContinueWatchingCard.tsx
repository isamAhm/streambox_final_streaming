import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlayIcon } from '@heroicons/react/24/solid';

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
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ data }) => {
    const router = useRouter();

    const redirectToWatch = useCallback(() => router.push(`/watch/${data.id}`), [router, data.id]);

    return (
        <div className="group relative h-full cursor-pointer" onClick={redirectToWatch}>
            {/* Main Card - Landscape 16:9 */}
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-zinc-800">
                <img
                    src={data.thumbnailUrl}
                    alt={data.title}
                    draggable={false}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                />

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                <h3 className="text-white text-sm font-semibold truncate group-hover:text-gray-300 transition-colors">
                    {data.title}
                </h3>
            </div>
        </div>
    );
}

export default ContinueWatchingCard;
