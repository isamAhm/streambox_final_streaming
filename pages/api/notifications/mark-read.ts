import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'PATCH') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { currentUser } = await serverAuth(req);
        const { notificationId, markAll } = req.body;

        if (markAll) {
            // Mark all notifications as read
            await prismadb.notification.updateMany({
                where: {
                    userId: currentUser.id,
                    read: false,
                },
                data: {
                    read: true,
                },
            });

            return res.status(200).json({ success: true, message: 'All notifications marked as read' });
        }

        if (!notificationId) {
            return res.status(400).json({ error: 'Notification ID is required' });
        }

        // Mark single notification as read
        const notification = await prismadb.notification.updateMany({
            where: {
                id: notificationId,
                userId: currentUser.id,
            },
            data: {
                read: true,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark read API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
