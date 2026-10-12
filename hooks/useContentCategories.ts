import useSWR from 'swr';
import fetcher from '@/libs/fetcher';

// Fetch from TMDB API directly
export const useTrendingMovies = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=trending-movies', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useTrendingSeries = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=trending-series', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useNetflixMovies = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=movies-netflix', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useNetflixSeries = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=series-netflix', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useAwardWinningMovies = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=award-winning-movies', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useAwardWinningShows = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=award-winning-shows', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useTopRatedMovies = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=top-rated-movies', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useTopRatedSeries = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=top-rated-series', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useOscarNominees = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=oscar-nominees', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const usePsychologicalThrillers = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=psychological-thrillers', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useCannesFestival = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=cannes-festival', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useHalloweenMovies = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=halloween', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useRottenTomatoesBest = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=rotten-tomatoes-best', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useMindfuckMovies = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=mindfuck-movies', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};

export const useBasedOnTrueStory = () => {
    const { data, error, isLoading } = useSWR('/api/tmdb/categories?category=based-on-true-story', fetcher);

    return {
        data: data || [],
        error,
        isLoading,
    };
};
