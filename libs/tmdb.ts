// TMDB API Integration
// Get your API key from https://www.themoviedb.org/settings/api

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date: string;
    vote_average: number;
    genre_ids: number[];
    imdb_id?: string;
}

export interface TMDBTVShow {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    first_air_date: string;
    vote_average: number;
    genre_ids: number[];
}

export interface TMDBMovieDetails extends TMDBMovie {
    runtime: number;
    genres: { id: number; name: string }[];
    imdb_id: string;
}

export interface TMDBTVShowDetails extends TMDBTVShow {
    episode_run_time: number[];
    genres: { id: number; name: string }[];
    external_ids?: {
        imdb_id: string;
    };
}

class TMDBService {
    private apiKey: string;

    constructor() {
        if (!TMDB_API_KEY) {
            throw new Error('TMDB_API_KEY is not defined in environment variables');
        }
        this.apiKey = TMDB_API_KEY;
    }

    private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);

        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.statusText}`);
        }

        return response.json();
    }

    // Get trending movies
    async getTrendingMovies(timeWindow: 'day' | 'week' = 'week') {
        return this.fetch<{ results: TMDBMovie[] }>(`/trending/movie/${timeWindow}`);
    }

    // Get trending TV shows
    async getTrendingTVShows(timeWindow: 'day' | 'week' = 'week') {
        return this.fetch<{ results: TMDBTVShow[] }>(`/trending/tv/${timeWindow}`);
    }

    // Get popular movies
    async getPopularMovies(page: number = 1) {
        return this.fetch<{ results: TMDBMovie[] }>('/movie/popular', { page: page.toString() });
    }

    // Get popular TV shows
    async getPopularTVShows(page: number = 1) {
        return this.fetch<{ results: TMDBTVShow[] }>('/tv/popular', { page: page.toString() });
    }

    // Get movie details by TMDB ID
    async getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
        return this.fetch<TMDBMovieDetails>(`/movie/${tmdbId}`);
    }

    // Get TV show details by TMDB ID
    async getTVShowDetails(tmdbId: number): Promise<TMDBTVShowDetails> {
        const [details, externalIds] = await Promise.all([
            this.fetch<TMDBTVShowDetails>(`/tv/${tmdbId}`),
            this.fetch<{ imdb_id: string }>(`/tv/${tmdbId}/external_ids`)
        ]);

        return {
            ...details,
            external_ids: externalIds
        };
    }

    // Get movie videos (trailers, teasers, etc.)
    async getMovieVideos(tmdbId: number) {
        return this.fetch<{ results: Array<{ key: string; type: string; site: string; name: string }> }>(`/movie/${tmdbId}/videos`);
    }

    // Get TV show videos (trailers, teasers, etc.)
    async getTVShowVideos(tmdbId: number) {
        return this.fetch<{ results: Array<{ key: string; type: string; site: string; name: string }> }>(`/tv/${tmdbId}/videos`);
    }

    // Get YouTube trailer URL for a movie
    async getMovieTrailer(tmdbId: number): Promise<string | null> {
        try {
            const videos = await this.getMovieVideos(tmdbId);
            // Find official trailer or teaser from YouTube
            const trailer = videos.results.find(
                v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            );
            // Use youtube-nocookie.com to reduce bot detection
            return trailer ? `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&loop=1&playlist=${trailer.key}&enablejsapi=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}` : null;
        } catch (error) {
            console.error('Error fetching movie trailer:', error);
            return null;
        }
    }

    // Get YouTube trailer URL for a TV show
    async getTVShowTrailer(tmdbId: number): Promise<string | null> {
        try {
            const videos = await this.getTVShowVideos(tmdbId);
            // Find official trailer or teaser from YouTube
            const trailer = videos.results.find(
                v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            );
            // Use youtube-nocookie.com to reduce bot detection
            return trailer ? `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&loop=1&playlist=${trailer.key}&enablejsapi=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}` : null;
        } catch (error) {
            console.error('Error fetching TV show trailer:', error);
            return null;
        }
    }

    // Search movies
    async searchMovies(query: string, page: number = 1) {
        return this.fetch<{ results: TMDBMovie[] }>('/search/movie', {
            query,
            page: page.toString()
        });
    }

    // Search TV shows
    async searchTVShows(query: string, page: number = 1) {
        return this.fetch<{ results: TMDBTVShow[] }>('/search/tv', {
            query,
            page: page.toString()
        });
    }

    // Get full image URL
    getImageUrl(path: string, size: 'w500' | 'w780' | 'original' = 'w500'): string {
        if (!path) return '/images/placeholder.jpg';
        return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
    }

    // Get backdrop URL
    getBackdropUrl(path: string, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
        if (!path) return '/images/hero.jpg';
        return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
    }

    // Convert TMDB movie to our Movie format
    convertToMovie(tmdbMovie: TMDBMovieDetails) {
        return {
            title: tmdbMovie.title,
            description: tmdbMovie.overview,
            thumbnailUrl: this.getImageUrl(tmdbMovie.poster_path, 'w500'),
            backdropUrl: tmdbMovie.backdrop_path ? this.getBackdropUrl(tmdbMovie.backdrop_path, 'w1280') : null,
            genre: tmdbMovie.genres.map(g => g.name).join(', '),
            duration: `${tmdbMovie.runtime} minutes`,
            imdbId: tmdbMovie.imdb_id,
            tmdbId: tmdbMovie.id,
            year: new Date(tmdbMovie.release_date).getFullYear(),
            rating: tmdbMovie.vote_average,
            type: 'movie'
        };
    }

    // Convert TMDB TV show to our Movie format
    convertToTVShow(tmdbShow: TMDBTVShowDetails) {
        const runtime = tmdbShow.episode_run_time?.[0] || 45;
        return {
            title: tmdbShow.name,
            description: tmdbShow.overview,
            thumbnailUrl: this.getImageUrl(tmdbShow.poster_path, 'w500'),
            backdropUrl: tmdbShow.backdrop_path ? this.getBackdropUrl(tmdbShow.backdrop_path, 'w1280') : null,
            genre: tmdbShow.genres.map(g => g.name).join(', '),
            duration: `${runtime} minutes per episode`,
            imdbId: tmdbShow.external_ids?.imdb_id,
            tmdbId: tmdbShow.id,
            year: new Date(tmdbShow.first_air_date).getFullYear(),
            rating: tmdbShow.vote_average,
            popularity: (tmdbShow as any).popularity || 0,
            type: 'tv'
        };
    }
}

export const tmdbService = new TMDBService();
