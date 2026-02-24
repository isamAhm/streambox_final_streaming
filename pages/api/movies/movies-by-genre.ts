import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).end();
        }

        await serverAuth(req);

        const { genre } = req.query;

        if (!genre || typeof genre !== 'string') {
            return res.status(400).json({ error: 'Genre is required' });
        }

        // Find movies that contain the genre in their genre string
        const movies = await prismadb.movie.findMany({
            where: {
                type: 'movie',
                genre: {
                    contains: genre,
                    mode: 'insensitive'
                }
            },
            orderBy: {
                popularity: 'desc'
            }
        });

        return res.status(200).json(movies);
    } catch (error) {
        console.log({ error })
        return res.status(500).end();
    }
}
