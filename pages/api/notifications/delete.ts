import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'DELETE') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { currentUser } = await serverAuth(req);
        const { notificationId } = req.query;

        if (!notificationId || typeof notificationId !== 'string') {
            return res.status(400).json({ error: 'Notification ID is required' });
        }

        await prismadb.notification.deleteMany({
            where: {
                id: notificationId,
                userId: currentUser.id,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete notification API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
