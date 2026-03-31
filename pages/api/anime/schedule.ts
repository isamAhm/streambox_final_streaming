import { NextApiRequest, NextApiResponse } from 'next';

const ANILIST_URL = 'https://graphql.anilist.co';

async function gql(query: string, variables: Record<string, unknown>) {
    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    // Cache for 10 minutes — schedule data doesn't change that fast
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

    try {
        const now = Math.floor(Date.now() / 1000);
        const weekLater = now + 7 * 24 * 3600;

        // Single batched query — 1 request instead of 4
        const data = await gql(`
            query($from: Int, $to: Int) {
                newReleases: Page(perPage: 8) {
                    media(type: ANIME, status: RELEASING, sort: START_DATE_DESC, isAdult: false) {
                        id title { romaji english } coverImage { medium } format episodes
                        startDate { year month day }
                        nextAiringEpisode { episode }
                    }
                }
                upcoming: Page(perPage: 8) {
                    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
                        id title { romaji english } coverImage { medium } format episodes
                        startDate { year month day }
                    }
                }
                completed: Page(perPage: 8) {
                    media(type: ANIME, status: FINISHED, sort: END_DATE_DESC, isAdult: false) {
                        id title { romaji english } coverImage { medium } format episodes
                        endDate { year month day }
                        nextAiringEpisode { episode }
                    }
                }
                airingPage: Page(perPage: 50) {
                    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
                        airingAt episode
                        media { id title { romaji english } coverImage { medium } format }
                    }
                }
            }
        `, { from: now, to: weekLater });

        return res.status(200).json({
            newReleases: data.newReleases.media,
            upcoming: data.upcoming.media,
            completed: data.completed.media,
            schedule: data.airingPage.airingSchedules,
        });
    } catch (error) {
        console.error('Schedule error:', error);
        return res.status(500).json({ error: 'Failed to fetch schedule' });
    }
}
