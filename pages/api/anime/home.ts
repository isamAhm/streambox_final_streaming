import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeAnime } from '@/lib/anilist';
import { cache } from '@/lib/cache';

const ANILIST_URL = 'https://graphql.anilist.co';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const MEDIA_FIELDS = `
    id title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large }
    bannerImage genres averageScore episodes
    status type format startDate { year }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    try {
        const cacheKey = 'anime:home';
        const cached = cache.get<object>(cacheKey);
        if (cached) return res.status(200).json(cached);

        // Single GraphQL request
        const response = await fetch(ANILIST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                query: `query {
                    trending: Page(perPage: 20) {
                        media(sort: TRENDING_DESC, type: ANIME, isAdult: false, status_in: [RELEASING, FINISHED]) { ${MEDIA_FIELDS} }
                    }
                    popular: Page(perPage: 20) {
                        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status_in: [RELEASING, FINISHED]) { ${MEDIA_FIELDS} }
                    }
                    movies: Page(perPage: 20) {
                        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, format: MOVIE, status_in: [RELEASING, FINISHED]) { ${MEDIA_FIELDS} }
                    }
                    series: Page(perPage: 20) {
                        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, format: TV, status_in: [RELEASING, FINISHED]) { ${MEDIA_FIELDS} }
                    }
                    upcoming: Page(perPage: 20) {
                        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: NOT_YET_RELEASED) { ${MEDIA_FIELDS} }
                    }
                }`,
            }),
        });

        const json = await response.json();
        if (json.errors) throw new Error(json.errors[0].message);

        const d = json.data;
        const result = {
            trending: d.trending.media.map(normalizeAnime),
            popular: d.popular.media.map(normalizeAnime),
            movies: d.movies.media.map(normalizeAnime),
            series: d.series.media.map(normalizeAnime),
            upcoming: d.upcoming.media.map(normalizeAnime),
        };
        cache.set('anime:home', result, CACHE_TTL);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Anime home error:', error?.message);
        return res.status(500).json({ error: 'Failed to fetch anime data' });
    }
}
