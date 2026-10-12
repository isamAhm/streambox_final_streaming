import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).end();
    }

    try {
        const series = await prismadb.movie.findMany({
            where: {
                type: 'tv',
            },
            orderBy: {
                popularity: 'desc',
            },
            take: 20,
        });

        return res.status(200).json(series);
    } catch (error) {
        console.error('[TRENDING_SERIES_ERROR]', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
