import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import prismadb from '@/libs/prismadb';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { userId: clerkUserId } = getAuth(req);
        if (!clerkUserId) return res.status(401).json({ error: 'Not signed in' });

        const roomId = nanoid(8);

        await prismadb.cinemaRoom.create({
            data: {
                roomId,
                hostUserId: clerkUserId,  // Store Clerk userId, not Prisma ObjectId
                playbackState: { contentId: null, startTimestamp: 0, startedAt: null, isPlaying: false },
                isActive: true,
            },
        });

        await prismadb.cinemaRoomParticipant.create({
            data: { roomId, userId: clerkUserId, isHost: true },
        });

        return res.status(200).json({ roomId, roomLink: `/cinema-room/${roomId}` });
    } catch (error) {
        console.error('Cinema room create error:', error);
        return res.status(500).json({ error: 'Failed to create room' });
    }
}
