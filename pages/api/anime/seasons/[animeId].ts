import { NextApiRequest, NextApiResponse } from 'next';
import { cache } from '@/lib/cache';

const ANILIST_URL = 'https://graphql.anilist.co';
const TV_FORMATS = ['TV', 'TV_SHORT'];
const MAX_SEASONS = 10;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours — season structure rarely changes

async function gql(query: string, variables: Record<string, unknown>) {
    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
}

function isValidSeason(node: any): boolean {
    return (
        node.type === 'ANIME' &&
        TV_FORMATS.includes(node.format) &&
        (node.episodes == null || node.episodes > 1)
    );
}

const MEDIA_WITH_RELATIONS = `
    id title{english romaji} episodes coverImage{large} startDate{year} status format
    relations { edges { relationType node { id type format episodes } } }
`;

// Fetch a single media entry with its relations
async function fetchMedia(id: number): Promise<Record<string, any> | null> {
    const data = await gql(
        `query($id:Int){Media(id:$id,type:ANIME){${MEDIA_WITH_RELATIONS}}}`,
        { id }
    );
    return data?.Media ?? null;
}

// Walk PREQUEL chain to find first season — but cap at 5 steps
async function getFirstSeason(startId: number): Promise<number> {
    let current = startId;
    const visited = new Set<number>();
    let steps = 0;

    while (steps < 5 && !visited.has(current)) {
        visited.add(current);
        const data = await gql(
            `query($id:Int){Media(id:$id,type:ANIME){relations{edges{relationType node{id type format episodes}}}}}`,
            { id: current }
        );
        const prequel = data?.Media?.relations?.edges?.find(
            (e: any) => e.relationType === 'PREQUEL' && isValidSeason(e.node)
        );
        if (!prequel) break;
        current = prequel.node.id;
        steps++;
    }
    return current;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { animeId } = req.query as { animeId: string };
    const id = parseInt(animeId);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const cacheKey = `seasons:${id}`;
        const cached = cache.get<{ seasons: any[]; currentSeasonIndex: number }>(cacheKey);
        if (cached) {
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
            return res.status(200).json(cached);
        }

        // Step 1: fetch the starting entry to check if it even has sequel/prequel relations
        const startMedia = await fetchMedia(id);
        if (!startMedia) return res.status(404).json({ error: 'Not found' });

        const hasSeasonRelations = startMedia.relations?.edges?.some(
            (e: any) => ['PREQUEL', 'SEQUEL'].includes(e.relationType) && isValidSeason(e.node)
        );

        // Fast path: no season relations
        if (!hasSeasonRelations) {
            const result = { seasons: [], currentSeasonIndex: 0 };
            cache.set(cacheKey, result, CACHE_TTL);
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
            return res.status(200).json(result);
        }

        // Step 2: walk to first season
        const firstId = await getFirstSeason(id);

        // Step 3: walk SEQUEL chain from first season, collecting all seasons
        const seasons = [];
        let current: number | null = firstId;
        const visited = new Set<number>();

        while (current && !visited.has(current) && seasons.length < MAX_SEASONS) {
            visited.add(current);
            const media: Record<string, any> | null = await fetchMedia(current);
            if (!media) break;

            seasons.push({
                id: media.id,
                title: media.title.english || media.title.romaji,
                episodes: media.episodes,
                year: media.startDate?.year,
                image: media.coverImage?.large,
                status: media.status,
                format: media.format,
            });

            const sequel: any = media.relations?.edges?.find(
                (e: any) => e.relationType === 'SEQUEL' && isValidSeason(e.node)
            );
            current = sequel?.node?.id ?? null;
        }

        if (seasons.length <= 1) {
            const result = { seasons: [], currentSeasonIndex: 0 };
            cache.set(cacheKey, result, CACHE_TTL);
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
            return res.status(200).json(result);
        }

        const currentSeasonIndex = Math.max(0, seasons.findIndex(s => s.id === id));
        const result = { seasons, currentSeasonIndex };
        cache.set(cacheKey, result, CACHE_TTL);
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Seasons error:', error?.message);
        // Return empty gracefully — don't crash the page
        return res.status(200).json({ seasons: [], currentSeasonIndex: 0 });
    }
}
