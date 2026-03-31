import { NextApiRequest, NextApiResponse } from 'next';
import { getUpcoming, normalizeAnime } from '@/lib/anilist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const raw = await getUpcoming();
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ results: raw.map(normalizeAnime) });
    } catch (error) {
        console.error('Upcoming error:', error);
        return res.status(500).json({ error: 'Failed to fetch upcoming' });
    }
}
