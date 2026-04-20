/**
 * /api/movies/trending
 * 1. Fetches TMDB trending this week (movies + TV)
 * 2. For items not in DB, fetches their IMDB ID and upserts them
 * 3. Returns full DB records so watch/modal/detail all work
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

/** Fetch IMDB ID for a TMDB item */
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

    try { await serverAuth(req); } catch { return res.status(401).end(); }

    if (!TMDB_KEY) {
        // Fallback: just return DB by popularity
        const fallback = await prismadb.movie.findMany({
            where: { popularity: { gt: 0 } },
            orderBy: { popularity: 'desc' },
            take: 20,
        });
        return res.status(200).json(fallback);
    }

    try {
        // 1. Fetch TMDB trending this week (movies + TV in parallel)
        const [movData, tvData] = await Promise.all([
            fetchTmdbJson(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`),
            fetchTmdbJson(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`),
        ]);

        // Interleave movies and TV (alternating) so the row is mixed
        const movResults = (movData.results || []).slice(0, 15);
        const tvResults = (tvData.results || []).slice(0, 15);
        const tmdbItems: Array<{ raw: any; type: 'movie' | 'tv' }> = [];
        const maxLen = Math.max(movResults.length, tvResults.length);
        for (let i = 0; i < maxLen; i++) {
            if (movResults[i]) tmdbItems.push({ raw: movResults[i], type: 'movie' });
            if (tvResults[i]) tmdbItems.push({ raw: tvResults[i], type: 'tv' });
        }

        // 2. Check which tmdbIds already exist in DB
        const tmdbIds = tmdbItems.map(i => i.raw.id);
        const existing = await prismadb.movie.findMany({
            where: { tmdbId: { in: tmdbIds } },
        });
        const existingMap = new Map(existing.map(m => [m.tmdbId, m]));

        // 3. Upsert missing items (fetch IMDB ID + full details, then insert)
        const toInsert = tmdbItems.filter(i => !existingMap.has(i.raw.id));

        if (toInsert.length > 0) {
            // Fetch details + external IDs in parallel (batched to avoid rate limits)
            const upsertResults = await Promise.allSettled(
                toInsert.map(async ({ raw, type }) => {
                    const imdbId = await getImdbId(raw.id, type);
                    if (!imdbId) return null; // skip items without IMDB ID

                    // Fetch full details for runtime/genres
                    let duration = '';
                    let genre = '';
                    let year = '';
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
                            // Update images + popularity in case they changed
                            thumbnailUrl: raw.poster_path ? `${TMDB_IMG}/w500${raw.poster_path}` : '',
                            backdropUrl: raw.backdrop_path ? `${TMDB_IMG}/w1280${raw.backdrop_path}` : null,
                            popularity: raw.popularity || 0,
                            rating: raw.vote_average || null,
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

            // Add newly upserted items to the existing map
            upsertResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    existingMap.set(result.value.tmdbId, result.value);
                }
            });
        }

        // 4. Return DB records in TMDB trending order
        const ordered = tmdbItems
            .map(i => existingMap.get(i.raw.id))
            .filter(Boolean) as typeof existing;

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json(ordered);
    } catch (err: any) {
        console.error('[trending]', err?.message);
        // Fallback to DB
        const fallback = await prismadb.movie.findMany({
            where: { popularity: { gt: 0 } },
            orderBy: { popularity: 'desc' },
            take: 20,
        });
        return res.status(200).json(fallback);
    }
}
