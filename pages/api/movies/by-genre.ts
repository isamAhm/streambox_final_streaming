import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).end();
    }

    try {
        const { genre, type = 'movie' } = req.query;

        if (!genre) {
            return res.status(400).json({ error: 'Genre is required' });
        }

        const content = await prismadb.movie.findMany({
            where: {
                type: type as string,
                genre: {
                    contains: genre as string,
                    mode: 'insensitive',
                },
            },
            orderBy: [
                { popularity: 'desc' },
                { rating: 'desc' },
            ],
            take: 20,
        });

        return res.status(200).json(content);
    } catch (error) {
        console.error('[BY_GENRE_ERROR]', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
