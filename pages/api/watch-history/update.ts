import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/libs/prismadb";
import serverAuth from "@/libs/serverAuth";

/**
 * API endpoint to update watch history
 * POST /api/watch-history/update
 * Body: { movieId: string, progress: number }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { currentUser } = await serverAuth(req);
        const { movieId, progress } = req.body;

        if (!movieId) {
            return res.status(400).json({ error: 'Movie ID is required' });
        }

        // Guard against non-ObjectId strings (e.g. fake TMDB IDs)
        if (!/^[a-f\d]{24}$/i.test(movieId)) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        if (typeof progress !== 'number' || progress < 0 || progress > 100) {
            return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
        }

        // Check if movie exists
        const movie = await prismadb.movie.findUnique({
            where: { id: movieId }
        });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Upsert watch history
        const watchHistory = await prismadb.watchHistory.upsert({
            where: {
                userId_movieId: {
                    userId: currentUser.id,
                    movieId: movieId
                }
            },
            update: {
                progress: progress,
                lastWatched: new Date(),
                completed: progress >= 95, // Mark as completed if 95% or more watched
            },
            create: {
                userId: currentUser.id,
                movieId: movieId,
                progress: progress,
                completed: progress >= 95,
            }
        });

        return res.status(200).json(watchHistory);

    } catch (error: any) {
        console.error('Update watch history error:', error);
        return res.status(500).json({
            error: 'Failed to update watch history',
            message: error.message
        });
    }
}
