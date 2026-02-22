import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/libs/prismadb";
import serverAuth from "@/libs/serverAuth";

/**
 * API endpoint to get user's watch history
 * GET /api/watch-history - Get continue watching list
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { currentUser } = await serverAuth(req);

        // Get watch history ordered by last watched
        const watchHistory = await prismadb.watchHistory.findMany({
            where: {
                userId: currentUser.id,
                completed: false, // Only show incomplete items
            },
            orderBy: {
                lastWatched: 'desc'
            },
            take: 20 // Limit to 20 items
        });

        // Get movie details for each history item
        const moviesWithProgress = await Promise.all(
            watchHistory.map(async (history) => {
                const movie = await prismadb.movie.findUnique({
                    where: { id: history.movieId }
                });

                if (!movie) return null;

                return {
                    ...movie,
                    progress: history.progress,
                    lastWatched: history.lastWatched,
                };
            })
        );

        // Filter out null values (movies that were deleted)
        const validMovies = moviesWithProgress.filter(movie => movie !== null);

        return res.status(200).json(validMovies);

    } catch (error: any) {
        console.error('Watch history error:', error);
        return res.status(500).json({
            error: 'Failed to fetch watch history',
            message: error.message
        });
    }
}
