import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const { currentUser } = await serverAuth(req);

            const notifications = await prismadb.notification.findMany({
                where: {
                    userId: currentUser.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 50, // Limit to 50 most recent notifications
            });

            return res.status(200).json(notifications);
        }

        if (req.method === 'POST') {
            const { currentUser } = await serverAuth(req);
            const { type, title, message, imageUrl, link } = req.body;

            if (!type || !title || !message) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const notification = await prismadb.notification.create({
                data: {
                    userId: currentUser.id,
                    type,
                    title,
                    message,
                    imageUrl,
                    link,
                },
            });

            return res.status(201).json(notification);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Notifications API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
