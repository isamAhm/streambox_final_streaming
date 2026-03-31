import { NextApiRequest, NextApiResponse } from 'next';
import { getAnimeInfo, normalizeAnime } from '@/lib/anilist';
import { HiAnime } from 'aniwatch';
import { ANIME } from '@consumet/extensions';
import { getEpisodes } from '@/lib/aniwatchClient';

const hianime = new HiAnime.Scraper();
const animePahe = new ANIME.AnimePahe();
const TIMEOUT_MS = 12000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);
}

/** Fetch episode thumbnails from AnimePahe, keyed by episode number */
async function getPaheThumbnails(title: string): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    try {
        const searchRes = await withTimeout(animePahe.search(title), TIMEOUT_MS);
        const match = (searchRes.results as any[])?.[0];
        if (!match?.id) return map;

        const paheInfo = await withTimeout(animePahe.fetchAnimeInfo(match.id), TIMEOUT_MS) as any;
        for (const ep of (paheInfo.episodes || [])) {
            if (ep.number && ep.image) {
                // Proxy through our image proxy so hotlink protection is bypassed
                map.set(ep.number, `/api/anime/proxy?url=${encodeURIComponent(ep.image)}`);
            }
        }
    } catch {
        // thumbnails are non-critical — silently skip
    }
    return map;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { animeId } = req.query as { animeId: string };

    try {
        const raw = await getAnimeInfo(parseInt(animeId));
        const info = normalizeAnime(raw);

        let episodes: any[] = [];
        const searchTitle = raw.title?.english || raw.title?.romaji;

        if (searchTitle) {
            // Fetch aniwatch episodes + AnimePahe thumbnails in parallel
            const [aniwatchEps, paheThumbs] = await Promise.all([
                withTimeout(
                    hianime.search(searchTitle).then(r => {
                        const results = r.animes || [];
                        if (!results.length) return [];

                        const expectedEps = info.totalEpisodes ?? 0;
                        const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const normTitle = normalise(searchTitle);

                        // Score each result: prefer exact title match + closest episode count
                        const scored = results.map((a: any) => {
                            const titleMatch = normalise(a.name) === normTitle ? 100 : 0;
                            const epCount = (a.episodes?.sub ?? a.episodes?.dub ?? 0) as number;
                            // Penalise by distance from expected episode count (0 expected = ignore)
                            const epScore = expectedEps > 0
                                ? Math.max(0, 50 - Math.abs(epCount - expectedEps))
                                : 0;
                            return { a, score: titleMatch + epScore + epCount * 0.01 };
                        });

                        scored.sort((x: any, y: any) => y.score - x.score);
                        const best = scored[0].a;
                        return best?.id ? getEpisodes(best.id) : [];
                    }),
                    TIMEOUT_MS
                ).catch(() => []),
                getPaheThumbnails(searchTitle),
            ]);

            episodes = (aniwatchEps as any[]).map((ep: any) => ({
                id: ep.episodeId,
                number: ep.number,
                title: ep.title,
                isFiller: ep.isFiller,
                image: paheThumbs.get(ep.number) ?? null,
            }));
        }

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ ...info, episodes });
    } catch (error: any) {
        console.error('[anime/info] Error:', error?.message);
        return res.status(500).json({ error: 'Failed to fetch anime info' });
    }
}
