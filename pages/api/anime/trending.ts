import { NextApiRequest, NextApiResponse } from 'next';
import { getTrending, getPopular, normalizeAnime } from '@/lib/anilist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { page = '1', type = 'trending', format } = req.query as { page?: string; type?: string; format?: string };

    try {
        const raw = type === 'popular'
            ? await getPopular(parseInt(page), format)
            : await getTrending(parseInt(page), format);
        // Cache for 5 minutes
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ results: raw.map(normalizeAnime) });
    } catch (error) {
        console.error('Anime trending error:', error);
        return res.status(500).json({ error: 'Failed to fetch anime' });
    }
}
