// Direct AniList GraphQL client — no scraping, fully reliable

const ANILIST_URL = 'https://graphql.anilist.co';

async function gql(query: string, variables: Record<string, unknown>) {
    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
}

const MEDIA_FIELDS = `
    id
    title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large }
    bannerImage
    genres
    averageScore
    episodes
    status
    type
    format
    startDate { year }
    trailer { id site }
`;

export async function getTrending(page = 1, format?: string) {
    const formatFilter = format ? `, format: ${format}` : '';
    const data = await gql(`
        query($page: Int) {
            Page(page: $page, perPage: 20) {
                media(sort: TRENDING_DESC, type: ANIME, isAdult: false${formatFilter}, status_in: [RELEASING, FINISHED]) { ${MEDIA_FIELDS} }
            }
        }
    `, { page });
    return data.Page.media;
}

export async function getPopular(page = 1, format?: string) {
    const formatFilter = format ? `, format: ${format}` : '';
    const data = await gql(`
        query($page: Int) {
            Page(page: $page, perPage: 20) {
                media(sort: POPULARITY_DESC, type: ANIME, isAdult: false${formatFilter}, status_in: [RELEASING, FINISHED]) { ${MEDIA_FIELDS} }
            }
        }
    `, { page });
    return data.Page.media;
}

export async function getUpcoming(page = 1) {
    const data = await gql(`
        query($page: Int) {
            Page(page: $page, perPage: 20) {
                media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: NOT_YET_RELEASED) { ${MEDIA_FIELDS} }
            }
        }
    `, { page });
    return data.Page.media;
}

export async function searchAnime(query: string, page = 1) {
    const data = await gql(`
        query($search: String, $page: Int) {
            Page(page: $page, perPage: 20) {
                media(search: $search, type: ANIME, isAdult: false) { ${MEDIA_FIELDS} }
            }
        }
    `, { search: query, page });
    return data.Page.media;
}

export async function getAnimeInfo(id: number) {
    const data = await gql(`
        query($id: Int) {
            Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} }
        }
    `, { id });
    return data.Media;
}

export async function getAnimeEpisodeThumbnails(id: number): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    try {
        const data = await gql(`
            query($id: Int) {
                Media(id: $id, type: ANIME) {
                    streamingEpisodes {
                        title
                        thumbnail
                        url
                        site
                    }
                }
            }
        `, { id });
        const episodes = data?.Media?.streamingEpisodes || [];
        episodes.forEach((ep: any, index: number) => {
            // AniList streamingEpisodes are ordered — use index+1 as episode number
            // Also try to parse episode number from title (e.g. "Episode 5 - Title")
            const epNumMatch = ep.title?.match(/Episode\s+(\d+)/i);
            const epNum = epNumMatch ? parseInt(epNumMatch[1]) : index + 1;
            if (ep.thumbnail) map.set(epNum, ep.thumbnail);
        });
    } catch {
        // Non-critical — silently skip
    }
    return map;
}

// Normalize AniList media to a consistent shape
export function normalizeAnime(media: any) {
    return {
        id: String(media.id),
        title: media.title,
        image: media.coverImage?.extraLarge || media.coverImage?.large || '',
        cover: media.bannerImage || media.coverImage?.extraLarge || '',
        description: media.description || '',
        genres: media.genres || [],
        rating: media.averageScore || null,
        totalEpisodes: media.episodes || null,
        status: media.status || null,
        type: media.format || media.type || null,
        releaseDate: media.startDate?.year || null,
    };
}
