import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'DELETE') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { currentUser } = await serverAuth(req);
        const { movieId } = req.query;

        if (!movieId || typeof movieId !== 'string') {
            return res.status(400).json({ error: 'Movie ID is required' });
        }

        await prismadb.watchlist.deleteMany({
            where: {
                userId: currentUser.id,
                movieId,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Remove from watchlist error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
