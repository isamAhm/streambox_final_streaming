import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { userId: clerkUserId } = getAuth(req);
        if (!clerkUserId) return res.status(401).json({ error: 'Not signed in' });

        const { roomId } = req.query as { roomId: string };

        const room = await prismadb.cinemaRoom.findUnique({ where: { roomId } });
        if (!room || !room.isActive) return res.status(404).json({ error: 'Room not found' });

        await prismadb.cinemaRoomParticipant.upsert({
            where: { roomId_userId: { roomId, userId: clerkUserId } },
            update: { joinedAt: new Date() },
            create: { roomId, userId: clerkUserId, isHost: false },
        });

        // hostUserId is stored as Clerk userId — return it directly
        return res.status(200).json({ room, hostUserId: room.hostUserId });
    } catch (error) {
        console.error('Cinema room join error:', error);
        return res.status(500).json({ error: 'Failed to join room' });
    }
}
