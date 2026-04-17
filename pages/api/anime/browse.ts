/**
 * /api/anime/browse?page=1&sort=popularity.desc&query=naruto
 * Fetches anime from TMDB — no AniList.
 */
import { NextApiRequest, NextApiResponse } from 'next';

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_IMG = 'https://image.tmdb.org/t/p';

// TMDB genre ID → name map (animation + common anime genres)
const GENRE_MAP: Record<number, string> = {
    16: 'Animation', 10759: 'Action & Adventure', 35: 'Comedy', 18: 'Drama',
    14: 'Fantasy', 27: 'Horror', 9648: 'Mystery', 10765: 'Sci-Fi & Fantasy',
    10768: 'War & Politics', 37: 'Western', 80: 'Crime', 99: 'Documentary',
    10751: 'Family', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10766: 'Soap', 10767: 'Talk',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    if (!TMDB_KEY) return res.status(500).json({ error: 'TMDB API key not configured' });

    const { page = '1', sort = 'popularity.desc', query } = req.query as {
        page?: string; sort?: string; query?: string;
    };

    try {
        let url: string;
        if (query) {
            url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query as string)}&page=${page}&with_genres=16`;
        } else {
            url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&with_genres=16&with_origin_country=JP&sort_by=${sort}&page=${page}&vote_count.gte=10`;
        }

        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) return res.status(r.status).json({ error: 'TMDB error' });
        const data = await r.json();

        const results = (data.results || []).map((item: any) => ({
            tmdbId: item.id,
            title: item.name,
            image: item.poster_path ? `${TMDB_IMG}/w300${item.poster_path}` : null,
            backdropUrl: item.backdrop_path ? `${TMDB_IMG}/w780${item.backdrop_path}` : null,
            rating: item.vote_average,
            year: (item.first_air_date || '').slice(0, 4),
            overview: item.overview || '',
            genres: (item.genre_ids || []).map((id: number) => GENRE_MAP[id]).filter(Boolean),
        }));

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({
            results,
            page: data.page,
            totalPages: Math.min(data.total_pages, 50),
            totalResults: data.total_results,
        });
    } catch (err: any) {
        console.error('[anime/browse]', err?.message);
        return res.status(500).json({ error: 'Failed to fetch anime' });
    }
}
