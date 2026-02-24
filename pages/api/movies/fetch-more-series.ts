import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";
import { tmdbService } from '@/libs/tmdb';
import { streamingService } from '@/libs/streaming';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).end();
        }

        await serverAuth(req);

        // Fetch from multiple TMDB endpoints to get more variety
        const [popularPages, trendingWeek, trendingDay, topRated] = await Promise.all([
            // Popular series (10 pages)
            Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(page =>
                tmdbService.getPopularTVShows(page)
            )),
            // Trending this week
            tmdbService.getTrendingTVShows('week'),
            // Trending today
            tmdbService.getTrendingTVShows('day'),
            // Top rated (first 5 pages)
            Promise.all([1, 2, 3, 4, 5].map(async (page) => {
                const response = await fetch(
                    `https://api.themoviedb.org/3/tv/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${page}`
                );
                return response.json();
            }))
        ]);

        // Combine all results
        const allShows = [
            ...popularPages.flatMap(response => response.results),
            ...trendingWeek.results,
            ...trendingDay.results,
            ...topRated.flatMap((response: any) => response.results)
        ];

        // Remove duplicates by TMDB ID
        const uniqueShows = Array.from(
            new Map(allShows.map(show => [show.id, show])).values()
        );

        console.log(`Processing ${uniqueShows.length} unique shows...`);

        // Process and save each show to database
        let successCount = 0;
        let errorCount = 0;

        for (const show of uniqueShows) {
            try {
                // Get full details including IMDB ID
                const details = await tmdbService.getTVShowDetails(show.id);

                if (!details.external_ids?.imdb_id) {
                    console.log(`No IMDB ID for show: ${show.name}`);
                    errorCount++;
                    continue;
                }

                // Generate streaming URL
                const videoUrl = streamingService.getTVShowStreamUrl(
                    details.external_ids.imdb_id,
                    1,
                    1,
                    details.id
                );

                // Convert to our format
                const showData = tmdbService.convertToTVShow(details);

                // Upsert to database
                await prismadb.movie.upsert({
                    where: { imdbId: details.external_ids.imdb_id },
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
                        type: 'tv',
                    },
                    create: {
                        title: showData.title,
                        description: showData.description,
                        thumbnailUrl: showData.thumbnailUrl,
                        genre: showData.genre,
                        duration: showData.duration,
                        videoUrl: videoUrl,
                        imdbId: details.external_ids.imdb_id,
                        tmdbId: showData.tmdbId,
                        year: showData.year,
                        rating: showData.rating,
                        type: 'tv',
                    },
                });

                successCount++;
            } catch (error) {
                console.error(`Error processing show ${show.name}:`, error);
                errorCount++;
            }
        }

        return res.status(200).json({
            message: 'Series fetch completed',
            total: uniqueShows.length,
            success: successCount,
            errors: errorCount
        });
    } catch (error) {
        console.log({ error })
        return res.status(500).end();
    }
}
