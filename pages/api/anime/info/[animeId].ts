/**
 * Anime info API
 * Uses AniList for metadata + TMDB for IMDB/TMDB IDs (for streaming)
 * + aniwatchtv.to for episode list
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { getAnimeInfo, normalizeAnime, getAnimeEpisodeThumbnails } from '@/lib/anilist';
import { HiAnime } from 'aniwatch';
import { getEpisodes } from '@/lib/aniwatchClient';

const hianime = new HiAnime.Scraper();
const TIMEOUT_MS = 12000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);
}

/** Search TMDB by title to get TMDB ID + IMDB ID + season number for streaming */
async function getTmdbIds(title: string, totalEpisodes: number | null): Promise<{
    imdbId: string | null;
    tmdbId: number | null;
    tmdbSeasonNum: number;
}> {
    const fallback = { imdbId: null, tmdbId: null, tmdbSeasonNum: 1 };
    if (!TMDB_API_KEY || !title) return fallback;
    try {
        const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!searchRes.ok) return fallback;
        const searchData = await searchRes.json();

        // Filter to animation genre (ID 16) to avoid live-action adaptations
        const animatedShows = searchData.results?.filter((r: any) =>
            r.genre_ids?.includes(16) || r.origin_country?.includes('JP')
        ) || [];
        const tv = animatedShows[0] || searchData.results?.[0];
        if (!tv) return fallback;

        // Fetch external IDs + season details in parallel
        const [extRes, tvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/tv/${tv.id}/external_ids?api_key=${TMDB_API_KEY}`, { signal: AbortSignal.timeout(5000) }),
            fetch(`https://api.themoviedb.org/3/tv/${tv.id}?api_key=${TMDB_API_KEY}`, { signal: AbortSignal.timeout(5000) }),
        ]);

        const extData = extRes.ok ? await extRes.json() : {};
        const tvData = tvRes.ok ? await tvRes.json() : {};

        // Find which TMDB season matches this AniList entry by episode count
        const seasons = (tvData.seasons || []).filter((s: any) => s.season_number > 0);
        let tmdbSeasonNum = 1;

        if (seasons.length > 1 && totalEpisodes) {
            for (const season of seasons) {
                if (Math.abs(season.episode_count - totalEpisodes) <= 5) {
                    tmdbSeasonNum = season.season_number;
                    break;
                }
            }
        }

        return {
            imdbId: extData.imdb_id || null,
            tmdbId: tv.id,
            tmdbSeasonNum,
        };
    } catch {
        return fallback;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { animeId } = req.query as { animeId: string };
    const anilistId = parseInt(animeId);

    try {
        const raw = await getAnimeInfo(anilistId);
        const info = normalizeAnime(raw);

        const searchTitle = raw.title?.english || raw.title?.romaji;

        // Fetch TMDB IDs + episodes + thumbnails in parallel
        const [tmdbIds, aniwatchEps, anilistThumbs] = await Promise.all([
            searchTitle ? getTmdbIds(searchTitle, info.totalEpisodes ?? null) : Promise.resolve({ imdbId: null, tmdbId: null, tmdbSeasonNum: 1 }),
            searchTitle
                ? withTimeout(
                    hianime.search(searchTitle).then(r => {
                        const results = r.animes || [];
                        if (!results.length) return [];
                        const expectedEps = info.totalEpisodes ?? 0;
                        const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const normTitle = normalise(searchTitle);
                        const scored = results.map((a: any) => {
                            const titleMatch = normalise(a.name) === normTitle ? 100 : 0;
                            const epCount = (a.episodes?.sub ?? a.episodes?.dub ?? 0) as number;
                            const epScore = expectedEps > 0 ? Math.max(0, 50 - Math.abs(epCount - expectedEps)) : 0;
                            return { a, score: titleMatch + epScore + epCount * 0.01 };
                        });
                        scored.sort((x: any, y: any) => y.score - x.score);
                        const best = scored[0].a;
                        return best?.id ? getEpisodes(best.id) : [];
                    }),
                    TIMEOUT_MS
                ).catch(() => [])
                : Promise.resolve([]),
            getAnimeEpisodeThumbnails(anilistId),
        ]);

        const episodes = (aniwatchEps as any[]).map((ep: any) => ({
            id: ep.episodeId,
            number: ep.number,
            title: ep.title,
            isFiller: ep.isFiller,
            image: anilistThumbs.get(ep.number) ?? null,
        }));

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({
            ...info,
            imdbId: tmdbIds.imdbId,
            tmdbId: tmdbIds.tmdbId,
            tmdbSeasonNum: tmdbIds.tmdbSeasonNum,
            episodes,
        });
    } catch (error: any) {
        console.error('[anime/info] Error:', error?.message);
        return res.status(500).json({ error: 'Failed to fetch anime info' });
    }
}
