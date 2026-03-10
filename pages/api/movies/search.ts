import { NextApiRequest, NextApiResponse } from "next";
import serverAuth from "@/libs/serverAuth";
import prismadb from "@/libs/prismadb";
import { tmdbService } from '@/libs/tmdb';
import { streamingService } from '@/libs/streaming';

/**
 * Hybrid Search System for StreamBox with Background Enrichment
 * 
 * Flow:
 * 1. Query MongoDB first (fast, <20ms)
 * 2. Return database results immediately
 * 3. Fetch additional results from TMDB in background (fire and forget)
 * 4. Cache TMDB results for future searches
 * 
 * GET /api/movies/search?query=inception&type=movie
 */

// Background cache function (fire and forget)
async function cacheAdditionalResults(query: string, type: string, existingIds: string[]) {
    try {
        console.log(`🔄 Background: Fetching additional results for "${query}"`);

        // Search movies from TMDB
        if (type === 'movie' || type === 'all') {
            try {
                const movieResults = await tmdbService.searchMovies(query, 1);

                // Process top 5 results that aren't already in database
                let cached = 0;
                for (const movie of movieResults.results.slice(0, 5)) {
                    try {
                        const details = await tmdbService.getMovieDetails(movie.id);

                        if (!details.imdb_id) continue;
                        if (existingIds.includes(details.imdb_id)) continue; // Skip if already returned

                        const movieData = tmdbService.convertToMovie(details);
                        const videoUrl = streamingService.getMovieStreamUrl(details.imdb_id, details.id);

                        await prismadb.movie.upsert({
                            where: { imdbId: details.imdb_id },
                            update: {
                                title: movieData.title,
                                description: movieData.description,
                                thumbnailUrl: movieData.thumbnailUrl,
                                genre: movieData.genre,
                                duration: movieData.duration,
                                videoUrl: videoUrl,
                                tmdbId: movieData.tmdbId,
                                year: movieData.year,
                                rating: movieData.rating,
                                popularity: (details as any).popularity || 0,
                                type: movieData.type,
                            },
                            create: {
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
                                popularity: (details as any).popularity || 0,
                                type: movieData.type,
                            }
                        });

                        cached++;
                        console.log(`✅ Background: Cached movie "${movieData.title}"`);

                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (error: any) {
                        console.error(`❌ Background: Error caching movie:`, error.message);
                    }
                }

                console.log(`🔄 Background: Cached ${cached} additional movies`);
            } catch (error: any) {
                console.error('❌ Background: Movie search error:', error.message);
            }
        }

        // Search TV shows from TMDB
        if (type === 'tv' || type === 'all') {
            try {
                const tvResults = await tmdbService.searchTVShows(query, 1);

                // Process top 5 results that aren't already in database
                let cached = 0;
                for (const show of tvResults.results.slice(0, 5)) {
                    try {
                        const details = await tmdbService.getTVShowDetails(show.id);
                        const imdbId = details.external_ids?.imdb_id || `tmdb_tv_${details.id}`;

                        if (existingIds.includes(imdbId)) continue; // Skip if already returned

                        const showData = tmdbService.convertToTVShow(details);
                        const videoUrl = details.external_ids?.imdb_id
                            ? streamingService.getTVShowStreamUrl(details.external_ids.imdb_id, 1, 1, details.id)
                            : '';

                        await prismadb.movie.upsert({
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
                                popularity: showData.popularity || 0,
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
                                popularity: showData.popularity || 0,
                                type: showData.type,
                            }
                        });

                        cached++;
                        console.log(`✅ Background: Cached TV show "${showData.title}"`);

                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (error: any) {
                        console.error(`❌ Background: Error caching TV show:`, error.message);
                    }
                }

                console.log(`🔄 Background: Cached ${cached} additional TV shows`);
            } catch (error: any) {
                console.error('❌ Background: TV show search error:', error.message);
            }
        }

        console.log(`✅ Background: Enrichment complete for "${query}"`);
    } catch (error: any) {
        console.error('❌ Background: Cache error:', error.message);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const startTime = Date.now();

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        await serverAuth(req);

        const { query, type = 'all', page = '1', limit = '20' } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        // ============================================
        // STEP 1: Query MongoDB First (Fast Search)
        // ============================================
        console.log(`🔍 Searching database for: "${query}"`);

        const dbSearchStart = Date.now();

        // Build search filter
        const searchFilter: any = {
            OR: [
                {
                    title: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: query,
                        mode: 'insensitive'
                    }
                }
            ]
        };

        // Add type filter if specified
        if (type !== 'all') {
            searchFilter.AND = [{ type: type }];
        }

        const dbResults = await prismadb.movie.findMany({
            where: searchFilter,
            orderBy: [
                { popularity: 'desc' },  // Most popular first
                { rating: 'desc' }       // Then by rating
            ],
            take: limitNum
        });

        const dbSearchTime = Date.now() - dbSearchStart;
        console.log(`⚡ Database search completed in ${dbSearchTime}ms`);
        console.log(`📊 Found ${dbResults.length} results in database`);

        // ============================================
        // STEP 2: Return Database Results Immediately
        // ============================================
        const totalTime = Date.now() - startTime;

        // Get existing IDs to avoid duplicates in background fetch
        const existingIds = dbResults.map(r => r.imdbId);

        // ============================================
        // STEP 3: Trigger Background Enrichment
        // ============================================
        // Fire and forget - don't wait for this to complete
        // Always enrich to keep database growing
        console.log(`🔄 Triggering background enrichment for "${query}"`);
        cacheAdditionalResults(query, type as string, existingIds).catch(err => {
            console.error('Background enrichment error:', err);
        });

        // Return immediately with database results
        return res.status(200).json({
            success: true,
            query,
            results: dbResults,
            page: pageNum,
            count: dbResults.length,
            source: 'database',
            enriching: true, // Indicates background fetch is happening
            performance: {
                totalTime: `${totalTime}ms`,
                dbSearchTime: `${dbSearchTime}ms`
            }
        });

    } catch (error: any) {
        console.error('❌ Search error:', error);
        return res.status(500).json({
            error: 'Failed to search content',
            message: error.message
        });
    }
}
