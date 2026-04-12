import { NextApiRequest, NextApiResponse } from 'next';
import { getAnimeInfo, normalizeAnime, getAnimeEpisodeThumbnails } from '@/lib/anilist';
import { HiAnime } from 'aniwatch';
import { getEpisodes } from '@/lib/aniwatchClient';

const hianime = new HiAnime.Scraper();
const TIMEOUT_MS = 12000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { animeId } = req.query as { animeId: string };
    const anilistId = parseInt(animeId);

    try {
        const raw = await getAnimeInfo(anilistId);
        const info = normalizeAnime(raw);

        let episodes: any[] = [];
        const searchTitle = raw.title?.english || raw.title?.romaji;

        if (searchTitle) {
            // Fetch aniwatch episodes + AniList thumbnails in parallel
            const [aniwatchEps, anilistThumbs] = await Promise.all([
                withTimeout(
                    hianime.search(searchTitle).then(r => {
                        const results = r.animes || [];
                        if (!results.length) return [];

                        const expectedEps = info.totalEpisodes ?? 0;
                        const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const normTitle = normalise(searchTitle);

                        const scored = results.map((a: any) => {
                            const titleMatch = normalise(a.name) === normTitle ? 100 : 0;
                            const epCount = (a.episodes?.sub ?? a.episodes?.dub ?? 0) as number;
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
                // Use AniList streamingEpisodes for thumbnails — reliable, no scraping
                getAnimeEpisodeThumbnails(anilistId),
            ]);

            episodes = (aniwatchEps as any[]).map((ep: any) => ({
                id: ep.episodeId,
                number: ep.number,
                title: ep.title,
                isFiller: ep.isFiller,
                image: anilistThumbs.get(ep.number) ?? null,
            }));
        }

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ ...info, episodes });
    } catch (error: any) {
        console.error('[anime/info] Error:', error?.message);
        return res.status(500).json({ error: 'Failed to fetch anime info' });
    }
}
