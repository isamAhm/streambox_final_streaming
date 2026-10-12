import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).end();
    }

    await serverAuth(req);

    const { movieId } = req.query;

    if (typeof movieId !== 'string') {
      throw new Error('Invalid Id');
    }

    if (!movieId) {
      throw new Error('Missing Id');
    }

    // Check if this is a TMDB-prefixed ID (from TMDB categories endpoint)
    if (movieId.startsWith('tmdb-')) {
      // This is TMDB data, not in our database
      // Return a 404 or handle it differently
      // The client should use TMDB data directly
      return res.status(404).json({
        error: 'Movie not found in database',
        tmdbId: movieId.replace('tmdb-', ''),
        message: 'This content is from TMDB and should be displayed using TMDB data'
      });
    }

    const movies = await prismadb.movie.findUnique({
      where: {
        id: movieId
      }
    });

    if (!movies) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.status(200).json(movies);
  } catch (error) {
    console.log(error);
    return res.status(500).end();
  }
}
