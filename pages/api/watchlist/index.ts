import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const { currentUser } = await serverAuth(req);
            const { status } = req.query;

            const where: any = {
                userId: currentUser.id,
            };

            if (status && typeof status === 'string') {
                where.status = status;
            }

            const watchlistItems = await prismadb.watchlist.findMany({
                where,
                orderBy: {
                    addedAt: 'desc',
                },
            });

            // Get movie details for each watchlist item
            const moviesWithStatus = await Promise.all(
                watchlistItems.map(async (item) => {
                    const movie = await prismadb.movie.findUnique({
                        where: { id: item.movieId },
                    });

                    if (!movie) return null;

                    return {
                        ...movie,
                        watchlistStatus: item.status,
                        addedAt: item.addedAt,
                    };
                })
            );

            const validMovies = moviesWithStatus.filter(movie => movie !== null);

            return res.status(200).json(validMovies);
        }

        if (req.method === 'POST') {
            const { currentUser } = await serverAuth(req);
            const { movieId, status } = req.body;

            if (!movieId || !status) {
                return res.status(400).json({ error: 'Movie ID and status are required' });
            }

            const validStatuses = ['watching', 'completed', 'plan_to_watch'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            // Check if movie exists
            const movie = await prismadb.movie.findUnique({
                where: { id: movieId },
            });

            if (!movie) {
                return res.status(404).json({ error: 'Movie not found' });
            }

            // Upsert watchlist entry
            const watchlistItem = await prismadb.watchlist.upsert({
                where: {
                    userId_movieId: {
                        userId: currentUser.id,
                        movieId,
                    },
                },
                update: {
                    status,
                    updatedAt: new Date(),
                },
                create: {
                    userId: currentUser.id,
                    movieId,
                    status,
                },
            });

            return res.status(200).json(watchlistItem);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        // Only log unexpected errors, not auth errors
        if (error instanceof Error && error.message !== 'Not signed in') {
            console.error('Watchlist API error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return res.status(error instanceof Error && error.message === 'Not signed in' ? 401 : 500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}
