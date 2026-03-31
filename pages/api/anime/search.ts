import { NextApiRequest, NextApiResponse } from 'next';
import { searchAnime, normalizeAnime } from '@/lib/anilist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { q, page = '1' } = req.query as { q: string; page?: string };
    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        const raw = await searchAnime(q, parseInt(page));
        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
        return res.status(200).json({ results: raw.map(normalizeAnime) });
    } catch (error) {
        console.error('Anime search error:', error);
        return res.status(500).json({ error: 'Search failed' });
    }
}
