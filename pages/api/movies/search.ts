import { NextApiRequest, NextApiResponse } from "next";
import serverAuth from "@/libs/serverAuth";
import prismadb from "@/libs/prismadb";
import { tmdbService } from '@/libs/tmdb';
import { streamingService } from '@/libs/streaming';

/**
 * API endpoint to search movies and TV shows from TMDB
 * GET /api/movies/search?query=inception&type=movie
 * Fetches from TMDB, saves to database, and returns saved movies
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        await serverAuth(req);

        const { query, type = 'all', page = '1', quick = 'false' } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const pageNum = parseInt(page as string);
        const isQuickSearch = quick === 'true';

        // For quick search, just search the database
        if (isQuickSearch) {
            // First check if we have any movies at all
            const totalMovies = await prismadb.movie.count();
            console.log(`Total movies in database: ${totalMovies}`);

            const results = await prismadb.movie.findMany({
                where: {
                    title: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                orderBy: {
                    popularity: 'desc'
                },
                take: 10
            });

            console.log(`Quick search for "${query}" found ${results.length} results`);
            return res.status(200).json(results);
        }

        let savedMovies: any[] = [];

        // Search movies
        if (type === 'movie' || type === 'all') {
            try {
                const movieResults = await tmdbService.searchMovies(query, pageNum);

                // Reduce to 10 results to avoid timeout on Vercel
                const moviesToProcess = movieResults.results.slice(0, 10);

                // Fetch details and save each movie
                for (const movie of moviesToProcess) {
                    try {
                        // Wrap the entire operation in a timeout
                        const processMovie = async () => {
                            const details = await tmdbService.getMovieDetails(movie.id);

                            if (!details.imdb_id) {
                                console.log(`Skipping movie ${details.title} - no IMDB ID`);
                                return null;
                            }

                            const movieData = tmdbService.convertToMovie(details);
                            const videoUrl = streamingService.getMovieStreamUrl(details.imdb_id, details.id);

                            // Check if movie already exists
                            const existing = await prismadb.movie.findFirst({
                                where: { imdbId: details.imdb_id }
                            });

                            let savedMovie;
                            if (existing) {
                                // Update existing movie
                                savedMovie = await prismadb.movie.update({
                                    where: { id: existing.id },
                                    data: {
                                        title: movieData.title,
                                        description: movieData.description,
                                        thumbnailUrl: movieData.thumbnailUrl,
                                        genre: movieData.genre,
                                        duration: movieData.duration,
                                        videoUrl: videoUrl,
                                        tmdbId: movieData.tmdbId,
                                        year: movieData.year,
                                        rating: movieData.rating,
                                        type: movieData.type,
                                    }
                                });
                            } else {
                                // Create new movie
                                savedMovie = await prismadb.movie.create({
                                    data: {
                                        title: movieData.title,
                                        description: movieData.description,
                                        thumbnailUrl: movieData.thumbnailUrl,
                                        genre: movieData.genre,
                                        duration: movieData.duration,
                                        videoUrl: videoUrl,
                                        imdbId: details.imdb_id,
                                        tmdbId: movieData.tmdbId,
                                        year: movieData.year,
                                        rating: movieData.rating,
                                        type: movieData.type,
                                    }
                                });
                            }

                            return savedMovie;
                        };

                        // Create timeout promise (3 seconds per movie)
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Operation timeout')), 3000);
                        });

                        // Race between processing and timeout
                        const savedMovie = await Promise.race([
                            processMovie(),
                            timeoutPromise
                        ]);

                        if (savedMovie) {
                            savedMovies.push(savedMovie);
                        }
                    } catch (error: any) {
                        console.error(`Error processing movie ${movie.title}:`, error.message);
                        // Continue with next movie instead of failing entire search
                    }
                }
            } catch (error: any) {
                console.error('Movie search error:', error.message);
                // Don't fail entire search if movies fail, just log and continue
            }
        }

        // Search TV shows
        if (type === 'tv' || type === 'all') {
            try {
                const tvResults = await tmdbService.searchTVShows(query, pageNum);

                // Reduce to 10 results to avoid timeout on Vercel
                const showsToProcess = tvResults.results.slice(0, 10);

                // Process TV shows with timeout protection
                for (const show of showsToProcess) {
                    try {
                        // Wrap the entire operation in a timeout
                        const processShow = async () => {
                            const details = await tmdbService.getTVShowDetails(show.id);

                            // Generate a fallback IMDB ID if not available (for display purposes)
                            const imdbId = details.external_ids?.imdb_id || `tmdb_tv_${details.id}`;

                            if (!details.external_ids?.imdb_id) {
                                console.log(`TV show ${details.name} has no IMDB ID, using fallback: ${imdbId}`);
                            }

                            const showData = tmdbService.convertToTVShow(details);
                            const videoUrl = details.external_ids?.imdb_id
                                ? streamingService.getTVShowStreamUrl(details.external_ids.imdb_id, 1, 1, details.id)
                                : ''; // Empty URL if no IMDB ID

                            // Upsert TV show to database with timeout
                            const savedShow = await prismadb.movie.upsert({
                                where: { imdbId: imdbId },
                                update: {
                                    title: showData.title,
                                    description: showData.description,
                                    thumbnailUrl: showData.thumbnailUrl,
                                    genre: showData.genre,
                                    duration: showData.duration,
                                    videoUrl: videoUrl,
                                    tmdbId: showData.tmdbId,
                                    year: showData.year,
                                    rating: showData.rating,
                                    type: showData.type,
                                },
                                create: {
                                    title: showData.title,
                                    description: showData.description,
                                    thumbnailUrl: showData.thumbnailUrl,
                                    genre: showData.genre,
                                    duration: showData.duration,
                                    videoUrl: videoUrl,
                                    imdbId: imdbId,
                                    tmdbId: showData.tmdbId,
                                    year: showData.year,
                                    rating: showData.rating,
                                    type: showData.type,
                                },
                            });

                            return savedShow;
                        };

                        // Create timeout promise (3 seconds per show)
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Operation timeout')), 3000);
                        });

                        // Race between processing and timeout
                        const savedShow = await Promise.race([
                            processShow(),
                            timeoutPromise
                        ]);

                        savedMovies.push(savedShow);
                    } catch (error: any) {
                        console.error(`Error processing TV show ${show.name}:`, error.message);
                        // Continue with next show instead of failing entire search
                    }
                }
            } catch (error: any) {
                console.error('TV show search error:', error.message);
                // Don't fail entire search if TV shows fail, just log and continue
            }
        }

        return res.status(200).json({
            success: true,
            query,
            results: savedMovies,
            page: pageNum,
            count: savedMovies.length
        });

    } catch (error: any) {
        console.error('Search error:', error);
        return res.status(500).json({
            error: 'Failed to search content',
            message: error.message
        });
    }
}
