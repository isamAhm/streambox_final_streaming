import useSwr from 'swr'
import fetcher from '@/libs/fetcher';

const useMovie = (id?: string) => {
  // Detect if this is a TMDB ID and route to the appropriate endpoint
  let apiUrl: string | null = null;

  if (id) {
    if (id.startsWith('tmdb-')) {
      // TMDB IDs are formatted as: tmdb-{type}-{id}
      // e.g., tmdb-movie-12345 or tmdb-tv-67890
      const parts = id.split('-');
      if (parts.length >= 3) {
        const type = parts[1]; // 'movie' or 'tv'
        const tmdbId = parts.slice(2).join('-'); // Handle IDs that might have dashes
        apiUrl = `/api/tmdb/details?tmdbId=${tmdbId}&type=${type}`;
      } else {
        // Fallback for old format (tmdb-{id})
        const tmdbId = id.replace('tmdb-', '');
        apiUrl = `/api/tmdb/details?tmdbId=${tmdbId}&type=movie`;
      }
    } else {
      // Regular database movie
      apiUrl = `/api/movies/${id}`;
    }
  }

  const { data, error, isLoading } = useSwr(apiUrl, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data,
    error,
    isLoading
  }
};

export default useMovie;
