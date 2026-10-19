/**
 * /api/movies/top-rated
 * Fetches TMDB top-rated movies + TV shows, upserts missing items into DB,
 * returns real DB records so watch/modal/detail all work.
 * Cached 24h — top rated changes very slowly.
 */
import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_IMG = 'https://image.tmdb.org/t/p';

async function fetchTmdbJson(url: string) {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
}

async function getImdbId(tmdbId: number, type: 'movie' | 'tv'): Promise<string | null> {
    try {
        const data = await fetchTmdbJson(
            `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`
        );
        return data.imdb_id || null;
    } catch {
        return null;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    // Guest mode: No authentication required for browsing top-rated content

    if (!TMDB_KEY) {
        const fallback = await prismadb.movie.findMany({
            where: { rating: { gte: 7.5 } },
            orderBy: { rating: 'desc' },
            take: 20,
        });
        return res.status(200).json(fallback);
    }

    try {
        // Fetch top-rated movies + TV in parallel
        const [movData, tvData] = await Promise.all([
            fetchTmdbJson(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_KEY}&page=1`),
            fetchTmdbJson(`https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_KEY}&page=1`),
        ]);

        // Interleave movies and TV
        const movResults = (movData.results || []).slice(0, 15);
        const tvResults = (tvData.results || []).slice(0, 15);
        const tmdbItems: Array<{ raw: any; type: 'movie' | 'tv' }> = [];
        const maxLen = Math.max(movResults.length, tvResults.length);
        for (let i = 0; i < maxLen; i++) {
            if (movResults[i]) tmdbItems.push({ raw: movResults[i], type: 'movie' });
            if (tvResults[i]) tmdbItems.push({ raw: tvResults[i], type: 'tv' });
        }

        // Check which already exist in DB
        const tmdbIds = tmdbItems.map(i => i.raw.id);
        const existing = await prismadb.movie.findMany({
            where: { tmdbId: { in: tmdbIds } },
        });
        const existingMap = new Map(existing.map(m => [m.tmdbId, m]));

        // Upsert missing items
        const toInsert = tmdbItems.filter(i => !existingMap.has(i.raw.id));

        if (toInsert.length > 0) {
            const upsertResults = await Promise.allSettled(
                toInsert.map(async ({ raw, type }) => {
                    const imdbId = await getImdbId(raw.id, type);
                    if (!imdbId) return null;

                    let duration = '', genre = '', year = '';
                    try {
                        const details = await fetchTmdbJson(
                            `https://api.themoviedb.org/3/${type}/${raw.id}?api_key=${TMDB_KEY}`
                        );
                        if (type === 'movie') {
                            duration = details.runtime ? `${details.runtime}m` : '';
                            year = (details.release_date || '').slice(0, 4);
                        } else {
                            const eps = details.episode_run_time?.[0];
                            duration = eps ? `${eps}m` : '';
                            year = (details.first_air_date || '').slice(0, 4);
                        }
                        genre = (details.genres || []).map((g: any) => g.name).slice(0, 3).join(', ');
                    } catch { /* use defaults */ }

                    return prismadb.movie.upsert({
                        where: { imdbId },
                        update: {
                            thumbnailUrl: raw.poster_path ? `${TMDB_IMG}/w500${raw.poster_path}` : '',
                            backdropUrl: raw.backdrop_path ? `${TMDB_IMG}/w1280${raw.backdrop_path}` : null,
                            rating: raw.vote_average || null,
                            popularity: raw.popularity || 0,
                        },
                        create: {
                            title: raw.title || raw.name,
                            description: raw.overview || '',
                            videoUrl: '',
                            thumbnailUrl: raw.poster_path ? `${TMDB_IMG}/w500${raw.poster_path}` : '',
                            backdropUrl: raw.backdrop_path ? `${TMDB_IMG}/w1280${raw.backdrop_path}` : null,
                            genre,
                            duration,
                            imdbId,
                            tmdbId: raw.id,
                            year: year ? parseInt(year) : null,
                            rating: raw.vote_average || null,
                            popularity: raw.popularity || 0,
                            type,
                        },
                    });
                })
            );

            upsertResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    existingMap.set(result.value.tmdbId, result.value);
                }
            });
        }

        // Return in TMDB top-rated order
        const ordered = tmdbItems
            .map(i => existingMap.get(i.raw.id))
            .filter(Boolean) as typeof existing;

        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
        return res.status(200).json(ordered);
    } catch (err: any) {
        console.error('[top-rated]', err?.message);
        const fallback = await prismadb.movie.findMany({
            where: { rating: { gte: 7.5 } },
            orderBy: { rating: 'desc' },
            take: 20,
        });
        return res.status(200).json(fallback);
    }
}
