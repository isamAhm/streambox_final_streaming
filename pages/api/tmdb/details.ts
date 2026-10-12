import { NextApiRequest, NextApiResponse } from 'next';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchFromTMDB(endpoint: string) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY!);
    url.searchParams.append('append_to_response', 'credits,videos');

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
}

function formatRuntime(minutes: number | null | undefined): string {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatEpisodeRuntime(episodeRuntime: number[] | null | undefined): string {
    if (!episodeRuntime || episodeRuntime.length === 0) return '45m';
    return `${episodeRuntime[0]}m`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tmdbId, type = 'movie' } = req.query;

        if (!tmdbId || typeof tmdbId !== 'string') {
            return res.status(400).json({ error: 'TMDB ID is required' });
        }

        const mediaType = type === 'tv' ? 'tv' : 'movie';
        const details = await fetchFromTMDB(`/${mediaType}/${tmdbId}`);

        const isMovie = mediaType === 'movie';

        // Get genre names
        const genres = details.genres?.map((g: any) => g.name).join(', ') || '';

        // Format the data to match our MovieInterface
        const formattedData = {
            id: `tmdb-${mediaType}-${tmdbId}`, // Include type in ID for consistency
            title: isMovie ? details.title : details.name,
            description: details.overview || 'No description available',
            thumbnailUrl: details.poster_path
                ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                : '/images/placeholder.jpg',
            backdropUrl: details.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
                : null,
            videoUrl: '', // Will be populated when watching
            genre: genres,
            duration: isMovie
                ? formatRuntime(details.runtime)
                : formatEpisodeRuntime(details.episode_run_time),
            year: new Date(isMovie ? details.release_date : details.first_air_date).getFullYear()?.toString() || '2024',
            rating: details.vote_average || 0,
            popularity: details.popularity || 0,
            type: mediaType,
            tmdbId: details.id,
            // Additional fields that might be useful
            tagline: details.tagline,
            status: details.status,
            originalLanguage: details.original_language,
            budget: details.budget,
            revenue: details.revenue,
            numberOfSeasons: details.number_of_seasons,
            numberOfEpisodes: details.number_of_episodes,
        };

        return res.status(200).json(formattedData);
    } catch (error: any) {
        console.error('[TMDB_DETAILS_ERROR]', error);
        return res.status(500).json({ error: 'Failed to fetch from TMDB', details: error.message });
    }
}
