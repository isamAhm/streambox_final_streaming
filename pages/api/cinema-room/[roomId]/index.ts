import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        await serverAuth(req);
        const { roomId } = req.query as { roomId: string };

        const room = await prismadb.cinemaRoom.findUnique({ where: { roomId } });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        const participants = await prismadb.cinemaRoomParticipant.findMany({
            where: { roomId },
            orderBy: { joinedAt: 'asc' },
        });

        return res.status(200).json({ room, participants });
    } catch (error) {
        console.error('Cinema room fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch room' });
    }
}
