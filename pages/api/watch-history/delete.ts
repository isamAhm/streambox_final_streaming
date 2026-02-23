import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import prismadb from '@/libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'DELETE') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { movieId } = req.query;

        if (!movieId || typeof movieId !== 'string') {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        // Delete the watch history entry
        await prismadb.watchHistory.deleteMany({
            where: {
                userId: userId,
                movieId: movieId,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting watch history:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
