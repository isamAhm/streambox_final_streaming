import { NextApiRequest, NextApiResponse } from "next";
import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";
import { tmdbService } from '@/libs/tmdb';
import { streamingService } from '@/libs/streaming';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).end();
        }

        await serverAuth(req);

        // Fetch popular TV shows from TMDB
        const popularShows = await tmdbService.getPopularTVShows(1);

        // Process and save each show to database
        const savedShows = await Promise.all(
            popularShows.results.slice(0, 20).map(async (show) => {
                try {
                    // Get full details including IMDB ID
                    const details = await tmdbService.getTVShowDetails(show.id);

                    if (!details.external_ids?.imdb_id) {
                        console.log(`No IMDB ID for show: ${show.name}`);
                        return null;
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
                    const savedShow = await prismadb.movie.upsert({
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

                    return savedShow;
                } catch (error) {
                    console.error(`Error processing show ${show.name}:`, error);
                    return null;
                }
            })
        );

        // Filter out null values and return
        const validShows = savedShows.filter(show => show !== null);

        return res.status(200).json(validShows);
    } catch (error) {
        console.log({ error })
        return res.status(500).end();
    }
}
