import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";
import { streamingService } from '@/libs/streaming';

/**
 * API endpoint to update streaming URLs for existing movies
 * GET /api/movies/update-urls
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        await serverAuth(req);

        // Get all movies
        const movies = await prismadb.movie.findMany();

        const updated = [];
        const failed = [];

        for (const movie of movies) {
            try {
                if (!movie.imdbId) {
                    failed.push({ id: movie.id, title: movie.title, reason: 'No IMDB ID' });
                    continue;
                }

                // Generate new streaming URL
                const streamUrl = movie.type === 'tv'
                    ? streamingService.getTVShowStreamUrl(movie.imdbId, 1, 1, movie.tmdbId || undefined)
                    : streamingService.getMovieStreamUrl(movie.imdbId, movie.tmdbId || undefined);

                // Update movie
                const updatedMovie = await prismadb.movie.update({
                    where: { id: movie.id },
                    data: { videoUrl: streamUrl }
                });

                updated.push({
                    id: updatedMovie.id,
                    title: updatedMovie.title,
                    oldUrl: movie.videoUrl,
                    newUrl: streamUrl
                });
            } catch (error) {
                console.error(`Error updating movie ${movie.title}:`, error);
                failed.push({ id: movie.id, title: movie.title, reason: 'Update failed' });
            }
        }

        return res.status(200).json({
            success: true,
            updated: updated.length,
            failed: failed.length,
            details: { updated, failed }
        });

    } catch (error: any) {
        console.error('Update URLs error:', error);
        return res.status(500).json({
            error: 'Failed to update URLs',
            message: error.message
        });
    }
}
