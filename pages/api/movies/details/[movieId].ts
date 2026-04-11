/**
 * /api/movies/details/[movieId]
 * Returns full TMDB details: cast, crew, seasons (TV), similar titles.
 */
import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';
import { tmdbService } from '@/libs/tmdb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        await serverAuth(req);

        const { movieId } = req.query as { movieId: string };
        const movie = await prismadb.movie.findUnique({ where: { id: movieId } });
        if (!movie) return res.status(404).json({ error: 'Not found' });

        const tmdbId = movie.tmdbId;
        const isTV = movie.type === 'tv';

        if (!tmdbId) return res.status(200).json({ movie, cast: [], crew: [], seasons: [], similar: [] });

        // Fetch credits + similar in parallel
        const [credits, similar, seasonDetails] = await Promise.all([
            tmdbService['fetch']<any>(
                isTV ? `/tv/${tmdbId}/credits` : `/movie/${tmdbId}/credits`
            ).catch(() => ({ cast: [], crew: [] })),
            tmdbService['fetch']<any>(
                isTV ? `/tv/${tmdbId}/similar` : `/movie/${tmdbId}/similar`
            ).catch(() => ({ results: [] })),
            isTV
                ? tmdbService['fetch']<any>(`/tv/${tmdbId}`).catch(() => null)
                : Promise.resolve(null),
        ]);

        const cast = (credits.cast || []).slice(0, 20).map((c: any) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path
                ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                : null,
        }));

        const crew = (credits.crew || [])
            .filter((c: any) => ['Director', 'Creator', 'Executive Producer'].includes(c.job))
            .slice(0, 6)
            .map((c: any) => ({ id: c.id, name: c.name, job: c.job }));

        const seasons = isTV && seasonDetails?.seasons
            ? seasonDetails.seasons
                .filter((s: any) => s.season_number > 0)
                .map((s: any) => ({
                    number: s.season_number,
                    name: s.name,
                    episodeCount: s.episode_count,
                    airDate: s.air_date,
                    posterUrl: s.poster_path
                        ? `https://image.tmdb.org/t/p/w300${s.poster_path}`
                        : null,
                    overview: s.overview,
                }))
            : [];

        const similarTitles = (similar.results || []).slice(0, 12).map((s: any) => ({
            tmdbId: s.id,
            title: s.title || s.name,
            posterUrl: s.poster_path
                ? `https://image.tmdb.org/t/p/w300${s.poster_path}`
                : null,
            rating: s.vote_average,
            year: (s.release_date || s.first_air_date || '').slice(0, 4),
        }));

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({ movie, cast, crew, seasons, similar: similarTitles });
    } catch (err) {
        console.error('[details]', err);
        return res.status(500).end();
    }
}
