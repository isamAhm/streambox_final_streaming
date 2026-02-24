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
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        console.log(`Deleting watch history for userId: ${currentUser.id}, movieId: ${movieId}`);

        // Delete the watch history entry
        const deleted = await prismadb.watchHistory.deleteMany({
            where: {
                userId: currentUser.id,
                movieId: movieId,
            },
        });

        console.log(`Deleted ${deleted.count} watch history entries`);

        return res.status(200).json({
            success: true,
            deletedCount: deleted.count
        });
    } catch (error) {
        console.error('Error deleting watch history:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
