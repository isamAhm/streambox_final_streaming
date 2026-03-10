import React from 'react';

const SearchMovieCardSkeleton = () => {
    return (
        <div className="group relative animate-pulse">
            {/* Thumbnail Skeleton */}
            <div className="
                relative
                h-[12rem]
                sm:h-[14rem]
                md:h-[16rem]
                lg:h-[18rem]
                rounded-md
                overflow-hidden
                bg-gray-800
            ">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent animate-shimmer"></div>
            </div>

            {/* Title Skeleton */}
            <div className="mt-2 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
        </div>
    );
};

export default SearchMovieCardSkeleton;
