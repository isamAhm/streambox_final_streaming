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

        const { fetchMore = 'false' } = req.query;
        const shouldFetchMore = fetchMore === 'true';

        // If fetchMore is requested, fetch the next batch from TMDB in background
        if (shouldFetchMore) {
            // Calculate next TMDB page to fetch
            const currentCount = await prismadb.movie.count({ where: { type: 'tv' } });
            const nextTMDBPage = Math.floor(currentCount / 20) + 1;

            // TMDB has a limit of 500 pages, so check if we've reached it
            if (nextTMDBPage <= 500) {
                console.log(`Fetching TMDB page ${nextTMDBPage} in background...`);

                // Fetch and process in background (don't block response)
                tmdbService.getPopularTVShows(nextTMDBPage).then(async (tmdbResponse) => {
                    // If we got results, process them
                    if (tmdbResponse.results && tmdbResponse.results.length > 0) {
                        await Promise.all(
                            tmdbResponse.results.map(async (show) => {
                                try {
                                    const details = await tmdbService.getTVShowDetails(show.id);

                                    if (!details.external_ids?.imdb_id) {
                                        return null;
                                    }

                                    // Filter: Only include English-language shows or shows with high popularity
                                    const isEnglish = (show as any).original_language === 'en';
                                    const isHighlyPopular = (show as any).popularity > 100;

                                    // Skip non-English shows unless they're extremely popular
                                    if (!isEnglish && !isHighlyPopular) {
                                        return null;
                                    }

                                    const videoUrl = streamingService.getTVShowStreamUrl(
                                        details.external_ids.imdb_id,
                                        1,
                                        1,
                                        details.id
                                    );

                                    const showData = tmdbService.convertToTVShow(details);

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
                                            popularity: showData.popularity,
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
                                            popularity: showData.popularity,
                                            type: 'tv',
                                        },
                                    });

                                    return true;
                                } catch (error) {
                                    console.error(`Error processing show:`, error);
                                    return null;
                                }
                            })
                        );
                        console.log(`Completed fetching TMDB page ${nextTMDBPage}`);
                    } else {
                        console.log(`No more series available from TMDB at page ${nextTMDBPage}`);
                    }
                }).catch(err => console.error('Background fetch error:', err));
            } else {
                console.log('Reached TMDB page limit (500 pages)');
            }
        }

        // Return all series from database immediately, sorted by popularity
        const series = await prismadb.movie.findMany({
            where: { type: 'tv' },
            orderBy: { popularity: 'desc' }
        });

        return res.status(200).json(series);
    } catch (error) {
        console.log({ error })
        return res.status(500).end();
    }
}
