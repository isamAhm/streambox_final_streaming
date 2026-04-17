// VidKing Streaming API Integration with Fallback Sources
// Professional player with episode selector, auto-play, and quality options

export interface StreamingSource {
    name: string;
    url: string;
    priority: number;
}

export class StreamingService {
    /**
     * Get all available streaming sources for a movie
     * VidKing is primary (uses TMDB ID), with fallbacks using IMDB ID
     */
    getMovieStreamSources(imdbId: string, tmdbId?: number): StreamingSource[] {
        const sources: StreamingSource[] = [];

        // VidKing as primary source (best player, uses TMDB ID)
        if (tmdbId) {
            sources.push({
                name: 'VidKing',
                url: `https://www.vidking.net/embed/movie/${tmdbId}?color=3B82F6&autoPlay=true`,
                priority: 1
            });
        }

        // Fallback sources (use IMDB ID)
        if (imdbId) {
            const fullId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;

            sources.push(
                {
                    name: 'VidSrc.xyz',
                    url: `https://vidsrc.xyz/embed/movie/${fullId}`,
                    priority: 2
                },
                {
                    name: 'VidSrc.to',
                    url: `https://vidsrc.to/embed/movie/${fullId}`,
                    priority: 3
                },
                {
                    name: 'VidSrc.me',
                    url: `https://vidsrc.me/embed/movie?imdb=${fullId}`,
                    priority: 4
                },
                {
                    name: '2Embed',
                    url: `https://www.2embed.cc/embed/${fullId}`,
                    priority: 5
                },
                {
                    name: 'SmashyStream',
                    url: `https://player.smashy.stream/movie/${fullId}`,
                    priority: 6
                }
            );
        }

        if (sources.length === 0) {
            throw new Error('IMDB ID or TMDB ID is required');
        }

        return sources.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get streaming sources for anime — VidKing is primary,
     * with 2Embed, VidSrc and others as fallbacks.
     */
    getAnimeStreamSources(
        imdbId: string,
        season: number = 1,
        episode: number = 1,
        tmdbId?: number
    ): StreamingSource[] {
        const sources: StreamingSource[] = [];
        const fullId = imdbId && !imdbId.startsWith('tt') ? `tt${imdbId}` : imdbId;

        // VidKing as primary (needs TMDB ID)
        if (tmdbId) {
            sources.push({
                name: 'VidKing',
                url: `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=3B82F6&autoPlay=true&nextEpisode=true&episodeSelector=true`,
                priority: 1,
            });
        }

        if (fullId) {
            sources.push(
                { name: '2Embed', url: `https://www.2embed.cc/embedtv/${fullId}&s=${season}&e=${episode}`, priority: 2 },
                { name: 'VidSrc.xyz', url: `https://vidsrc.xyz/embed/tv/${fullId}/${season}/${episode}`, priority: 3 },
                { name: 'VidSrc.to', url: `https://vidsrc.to/embed/tv/${fullId}/${season}/${episode}`, priority: 4 },
                { name: 'VidSrc.me', url: `https://vidsrc.me/embed/tv?imdb=${fullId}&season=${season}&episode=${episode}`, priority: 5 },
                { name: 'SmashyStream', url: `https://player.smashy.stream/tv/${fullId}?s=${season}&e=${episode}`, priority: 6 },
            );
        }

        if (sources.length === 0) throw new Error('At least TMDB ID or IMDB ID is required');
        return sources.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get all available streaming sources for a TV show episode
     * VidKing is primary with episode selector and auto-next features
     */
    getTVShowStreamSources(
        imdbId: string,
        season: number = 1,
        episode: number = 1,
        tmdbId?: number
    ): StreamingSource[] {
        const sources: StreamingSource[] = [];

        // VidKing as primary source (best player for TV shows)
        if (tmdbId) {
            sources.push({
                name: 'VidKing',
                url: `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=3B82F6&autoPlay=true&nextEpisode=true&episodeSelector=true`,
                priority: 1
            });
        }

        // Fallback sources (use IMDB ID)
        if (imdbId) {
            const fullId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;

            sources.push(
                {
                    name: 'VidSrc.xyz',
                    url: `https://vidsrc.xyz/embed/tv/${fullId}/${season}/${episode}`,
                    priority: 2
                },
                {
                    name: 'VidSrc.to',
                    url: `https://vidsrc.to/embed/tv/${fullId}/${season}/${episode}`,
                    priority: 3
                },
                {
                    name: 'VidSrc.me',
                    url: `https://vidsrc.me/embed/tv?imdb=${fullId}&season=${season}&episode=${episode}`,
                    priority: 4
                },
                {
                    name: '2Embed',
                    url: `https://www.2embed.cc/embedtv/${fullId}&s=${season}&e=${episode}`,
                    priority: 5
                },
                {
                    name: 'SmashyStream',
                    url: `https://player.smashy.stream/tv/${fullId}?s=${season}&e=${episode}`,
                    priority: 6
                }
            );
        }

        // VidKing works with TMDB only — always available if tmdbId provided
        if (sources.length === 0) {
            throw new Error('At least TMDB ID or IMDB ID is required');
        }

        return sources.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Generate primary streaming URL for a movie
     * Uses VidKing if TMDB ID available, otherwise falls back to VidSrc
     */
    getMovieStreamUrl(imdbId: string, tmdbId?: number): string {
        const sources = this.getMovieStreamSources(imdbId, tmdbId);
        return sources[0].url;
    }

    /**
     * Generate primary streaming URL for a TV show episode
     * Uses VidKing if TMDB ID available, otherwise falls back to VidSrc
     */
    getTVShowStreamUrl(imdbId: string, season: number = 1, episode: number = 1, tmdbId?: number): string {
        const sources = this.getTVShowStreamSources(imdbId, season, episode, tmdbId);
        return sources[0].url;
    }

    /**
     * Generate VidKing streaming URL using TMDB ID
     * @param tmdbId - TMDB ID
     * @param type - Content type ('movie' or 'tv')
     * @param season - Season number (for TV shows)
     * @param episode - Episode number (for TV shows)
     * @returns VidKing embed URL with custom color and features
     */
    getStreamUrlByTMDB(
        tmdbId: number,
        type: 'movie' | 'tv',
        season?: number,
        episode?: number
    ): string {
        if (type === 'movie') {
            return `https://www.vidking.net/embed/movie/${tmdbId}?color=3B82F6&autoPlay=true`;
        } else {
            const s = season || 1;
            const e = episode || 1;
            return `https://www.vidking.net/embed/tv/${tmdbId}/${s}/${e}?color=3B82F6&autoPlay=true&nextEpisode=true&episodeSelector=true`;
        }
    }

    /**
     * Check if IMDB ID is valid
     */
    isValidImdbId(imdbId: string): boolean {
        return /^tt\d{7,}$/.test(imdbId);
    }
}

export const streamingService = new StreamingService();
