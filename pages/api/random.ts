import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).end();
    }

    await serverAuth(req);

    // Pick from top 10 most popular AND well-rated titles for the billboard
    const trending = await prismadb.movie.findMany({
      where: {
        popularity: { gt: 50 },
        rating: { gte: 7.5 },
        thumbnailUrl: { not: '' },
      },
      orderBy: { popularity: 'desc' },
      take: 10,
    });

    // Fallback: just top popularity if rating filter yields nothing
    const pool = trending.length > 0
      ? trending
      : await prismadb.movie.findMany({
        where: { popularity: { gt: 0 }, thumbnailUrl: { not: '' } },
        orderBy: { popularity: 'desc' },
        take: 10,
      });

    const pick = pool[Math.floor(Math.random() * pool.length)];

    return res.status(200).json(pick);
  } catch (error) {
    console.log(error);
    return res.status(500).end();
  }
}
