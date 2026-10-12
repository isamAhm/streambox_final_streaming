import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).end();
    }

    try {
        const { type = 'movie' } = req.query;

        // Award-winning content typically has high ratings (8.0+)
        const content = await prismadb.movie.findMany({
            where: {
                type: type as string,
                rating: {
                    gte: 8.0,
                },
            },
            orderBy: [
                { rating: 'desc' },
                { popularity: 'desc' },
            ],
            take: 20,
        });

        return res.status(200).json(content);
    } catch (error) {
        console.error('[AWARD_WINNING_ERROR]', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
