import { NextApiRequest, NextApiResponse } from 'next';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBParams {
    [key: string]: string | number;
}

async function fetchFromTMDB(endpoint: string, params: TMDBParams = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY!);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
}

function convertTMDBToOurFormat(item: any, type: 'movie' | 'tv') {
    const isMovie = type === 'movie';

    return {
        id: `tmdb-${type}-${item.id}`, // Include type in ID for proper routing
        title: isMovie ? item.title : item.name,
        description: item.overview || 'No description available',
        thumbnailUrl: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : '/images/placeholder.jpg',
        backdropUrl: item.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
            : null,
        videoUrl: '', // Will be populated when watching
        genre: '', // Will be fetched separately if needed
        duration: isMovie ? '120 min' : '45 min',
        year: new Date(isMovie ? item.release_date : item.first_air_date).getFullYear() || 2024,
        rating: item.vote_average || 0,
        popularity: item.popularity || 0,
        type,
        tmdbId: item.id,
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { category, page: pageQuery = '1' } = req.query;
        const page = Array.isArray(pageQuery) ? pageQuery[0] : pageQuery;

        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        let data: any;
        let results: any[] = [];

        switch (category) {
            case 'trending-movies':
                data = await fetchFromTMDB('/trending/movie/week', { page });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'trending-series':
                data = await fetchFromTMDB('/trending/tv/week', { page });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'tv'));
                break;

            case 'movies-netflix':
                // Netflix provider ID is 8
                data = await fetchFromTMDB('/discover/movie', {
                    with_watch_providers: '8',
                    watch_region: 'US',
                    sort_by: 'popularity.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'series-netflix':
                data = await fetchFromTMDB('/discover/tv', {
                    with_watch_providers: '8',
                    watch_region: 'US',
                    sort_by: 'popularity.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'tv'));
                break;

            case 'award-winning-movies':
                // High vote average with significant vote count
                data = await fetchFromTMDB('/discover/movie', {
                    'vote_average.gte': '8',
                    'vote_count.gte': '1000',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'award-winning-shows':
                data = await fetchFromTMDB('/discover/tv', {
                    'vote_average.gte': '8',
                    'vote_count.gte': '500',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'tv'));
                break;

            case 'top-rated-movies':
                data = await fetchFromTMDB('/movie/top_rated', {
                    page,
                    region: 'US',
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'top-rated-series':
                data = await fetchFromTMDB('/tv/top_rated', {
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'tv'));
                break;

            case 'oscar-nominees':
                // Drama genre (18), high ratings, specific years
                data = await fetchFromTMDB('/discover/movie', {
                    with_genres: '18',
                    'vote_average.gte': '7.5',
                    'vote_count.gte': '1000',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'psychological-thrillers':
                // Thriller (53) and Mystery (9648)
                data = await fetchFromTMDB('/discover/movie', {
                    with_genres: '53',
                    'vote_average.gte': '7',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'cannes-festival':
                // International, art-house films - Drama and high ratings
                data = await fetchFromTMDB('/discover/movie', {
                    with_genres: '18',
                    'vote_average.gte': '7.5',
                    with_original_language: 'fr|en|it|es',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'halloween':
                // Horror (27) genre
                data = await fetchFromTMDB('/discover/movie', {
                    with_genres: '27',
                    sort_by: 'popularity.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'rotten-tomatoes-best':
                // Highest rated of all time
                data = await fetchFromTMDB('/discover/movie', {
                    'vote_average.gte': '8.5',
                    'vote_count.gte': '2000',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'mindfuck-movies':
                // Sci-Fi (878), Thriller (53), Mystery (9648)
                data = await fetchFromTMDB('/discover/movie', {
                    with_genres: '878,53,9648',
                    'vote_average.gte': '7.5',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            case 'based-on-true-story':
                // Documentary (99), History (36), Biography-like content
                data = await fetchFromTMDB('/discover/movie', {
                    with_genres: '36',
                    'vote_average.gte': '7',
                    sort_by: 'vote_average.desc',
                    page,
                });
                results = data.results.map((item: any) => convertTMDBToOurFormat(item, 'movie'));
                break;

            default:
                return res.status(400).json({ error: 'Invalid category' });
        }

        return res.status(200).json(results.slice(0, 20));
    } catch (error: any) {
        console.error('[TMDB_CATEGORIES_ERROR]', error);
        return res.status(500).json({ error: 'Failed to fetch from TMDB', details: error.message });
    }
}
