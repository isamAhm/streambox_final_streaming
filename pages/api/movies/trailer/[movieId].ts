import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import { tmdbService } from '@/libs/tmdb';

/**
 * API endpoint to get YouTube trailer URL for a movie
 * GET /api/movies/trailer/[movieId]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { movieId } = req.query;

        if (typeof movieId !== 'string') {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        // Guard against fake TMDB IDs (e.g. "tmdb-movie-123") that aren't valid ObjectIds
        const isValidObjectId = /^[a-f\d]{24}$/i.test(movieId);
        if (!isValidObjectId) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Get movie from database
        const movie = await prismadb.movie.findUnique({
            where: { id: movieId }
        });

        if (!movie || !movie.tmdbId) {
            return res.status(404).json({ error: 'Movie not found or no TMDB ID' });
        }

        // Fetch trailer from TMDB
        const trailerUrl = movie.type === 'tv'
            ? await tmdbService.getTVShowTrailer(movie.tmdbId)
            : await tmdbService.getMovieTrailer(movie.tmdbId);

        if (!trailerUrl) {
            return res.status(404).json({ error: 'No trailer available' });
        }

        return res.status(200).json({ trailerUrl });

    } catch (error: any) {
        console.error('Trailer fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch trailer',
            message: error.message
        });
    }
}
