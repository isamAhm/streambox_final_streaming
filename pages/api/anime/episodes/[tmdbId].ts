/**
 * /api/anime/episodes/[tmdbId]?season=1
 * Returns episode list with thumbnails and names from TMDB.
 */
import { NextApiRequest, NextApiResponse } from 'next';

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_IMG = 'https://image.tmdb.org/t/p';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    if (!TMDB_KEY) return res.status(500).json({ error: 'TMDB API key not configured' });

    const { tmdbId, season = '1' } = req.query as { tmdbId: string; season?: string };
    if (!tmdbId || isNaN(parseInt(tmdbId))) return res.status(400).json({ error: 'Invalid tmdbId' });

    try {
        const r = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=${TMDB_KEY}`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!r.ok) return res.status(r.status).json({ error: 'Season not found' });

        const data = await r.json();
        const episodes = (data.episodes || []).map((ep: any) => ({
            number: ep.episode_number,
            name: ep.name,
            overview: ep.overview || '',
            thumbnail: ep.still_path ? `${TMDB_IMG}/w300${ep.still_path}` : null,
            airDate: ep.air_date || '',
            runtime: ep.runtime || null,
        }));

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({ episodes });
    } catch (err: any) {
        console.error('[anime/episodes]', err?.message);
        return res.status(500).json({ error: 'Failed to fetch episodes' });
    }
}
