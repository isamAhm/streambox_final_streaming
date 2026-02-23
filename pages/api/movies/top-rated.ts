import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).end();
        }

        await serverAuth(req);

        const topRated = await prismadb.movie.findMany({
            where: {
                rating: {
                    gte: 7.5 // Movies/shows with rating >= 7.5
                }
            },
            orderBy: {
                rating: 'desc'
            },
            take: 20 // Limit to top 20
        });

        return res.status(200).json(topRated);
    } catch (error) {
        console.log({ error })
        return res.status(500).end();
    }
}
