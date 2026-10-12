import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).end();
    }

    try {
        const movies = await prismadb.movie.findMany({
            where: {
                type: 'movie',
                rating: {
                    gte: 7.5,
                },
            },
            orderBy: [
                { rating: 'desc' },
                { popularity: 'desc' },
            ],
            take: 20,
        });

        return res.status(200).json(movies);
    } catch (error) {
        console.error('[TOP_RATED_MOVIES_ERROR]', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
