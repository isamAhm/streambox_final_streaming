/**
 * /api/anime/tmdb-info/[tmdbId]
 * Fetches full anime details from TMDB.
 * If TMDB only has 1 season, enriches with AniList sequel chain to split
 * episodes into proper seasons (e.g. JJK S1=24eps, S2=23eps, etc.)
 */
import { NextApiRequest, NextApiResponse } from 'next';

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const ANILIST_URL = 'https://graphql.anilist.co';

// ─── AniList helpers ──────────────────────────────────────────────────────────

async function anilistQuery(query: string, variables: Record<string, unknown>) {
    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(6000),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
}

interface AniListEntry {
    id: number;
    title: { romaji: string; english: string | null };
    episodes: number | null;
    coverImage: { medium: string | null };
    startDate: { year: number | null };
    relations: {
        edges: Array<{
            relationType: string;
            node: {
                id: number;
                type: string;
                title: { romaji: string; english: string | null };
                episodes: number | null;
                coverImage: { medium: string | null };
                startDate: { year: number | null };
            };
        }>;
    };
}

const ENTRY_FRAGMENT = `
  id
  title { romaji english }
  episodes
  coverImage { medium }
  startDate { year }
  relations {
    edges {
      relationType
      node {
        id type
        title { romaji english }
        episodes
        coverImage { medium }
        startDate { year }
      }
    }
  }
`;

/** Search AniList by title, return best TV match */
async function searchAniList(title: string): Promise<AniListEntry | null> {
    try {
        const data = await anilistQuery(`
            query($search: String) {
                Page(perPage: 5) {
                    media(search: $search, type: ANIME, format_in: [TV, TV_SHORT]) {
                        ${ENTRY_FRAGMENT}
                    }
                }
            }
        `, { search: title });
        const results: AniListEntry[] = data?.Page?.media || [];
        return results[0] || null;
    } catch {
        return null;
    }
}

/** Walk the SEQUEL chain from an AniList entry, collecting TV entries in order */
async function collectSequelChain(root: AniListEntry): Promise<AniListEntry[]> {
    const chain: AniListEntry[] = [root];
    const visited = new Set<number>([root.id]);
    let current = root;

    for (let i = 0; i < 10; i++) { // max 10 sequels
        const sequelEdge = current.relations.edges.find(
            e => e.relationType === 'SEQUEL' && e.node.type === 'ANIME'
        );
        if (!sequelEdge) break;
        const nextId = sequelEdge.node.id;
        if (visited.has(nextId)) break;
        visited.add(nextId);

        try {
            const data = await anilistQuery(`
                query($id: Int) {
                    Media(id: $id, type: ANIME) { ${ENTRY_FRAGMENT} }
                }
            `, { id: nextId });
            const next: AniListEntry = data?.Media;
            if (!next || !next.episodes) break;
            chain.push(next);
            current = next;
        } catch {
            break;
        }
    }

    return chain;
}

/**
 * Given a TMDB single-season with N total episodes and an AniList sequel chain,
 * split into virtual seasons whose episode counts sum to <= N.
 */
function buildVirtualSeasons(
    tmdbSeason: { posterUrl: string | null; airDate: string },
    aniChain: AniListEntry[],
    totalTmdbEps: number
) {
    const seasons = [];
    let remaining = totalTmdbEps;
    let episodeOffset = 0; // cumulative offset into TMDB's single season

    for (let i = 0; i < aniChain.length; i++) {
        const entry = aniChain[i];
        const eps = entry.episodes || 0;
        if (eps <= 0 || remaining <= 0) break;

        const take = Math.min(eps, remaining);
        seasons.push({
            number: i + 1,
            name: entry.title.english || entry.title.romaji || `Season ${i + 1}`,
            episodeCount: take,
            airDate: entry.startDate?.year ? `${entry.startDate.year}-01-01` : tmdbSeason.airDate,
            posterUrl: entry.coverImage?.medium || tmdbSeason.posterUrl,
            overview: '',
            // tmdbSeason is always 1 for virtual splits; offset maps ep N -> TMDB ep (offset+N)
            tmdbSeasonNumber: 1,
            episodeOffset,
        });
        episodeOffset += take;
        remaining -= take;
    }

    // If AniList chain didn't cover all TMDB episodes, append a remainder season
    if (remaining > 0 && seasons.length > 0) {
        seasons.push({
            number: seasons.length + 1,
            name: `Season ${seasons.length + 1}`,
            episodeCount: remaining,
            airDate: tmdbSeason.airDate,
            posterUrl: tmdbSeason.posterUrl,
            overview: '',
            tmdbSeasonNumber: 1,
            episodeOffset,
        });
    }

    return seasons;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { tmdbId } = req.query as { tmdbId: string };
    if (!tmdbId || isNaN(parseInt(tmdbId))) return res.status(400).json({ error: 'Invalid tmdbId' });
    if (!TMDB_KEY) return res.status(500).json({ error: 'TMDB API key not configured' });

    try {
        const [tvRes, extRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=credits,similar`, {
                signal: AbortSignal.timeout(8000),
            }),
            fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_KEY}`, {
                signal: AbortSignal.timeout(5000),
            }),
        ]);

        if (!tvRes.ok) return res.status(tvRes.status).json({ error: 'Not found' });

        const tv = await tvRes.json();
        const ext = extRes.ok ? await extRes.json() : {};

        // TMDB seasons (filter out season 0 / specials)
        let seasons = (tv.seasons || [])
            .filter((s: any) => s.season_number > 0)
            .map((s: any) => ({
                number: s.season_number,
                name: s.name,
                episodeCount: s.episode_count,
                airDate: s.air_date || '',
                posterUrl: s.poster_path ? `${TMDB_IMG}/w300${s.poster_path}` : null,
                overview: s.overview || '',
                tmdbSeasonNumber: s.season_number, // actual TMDB season
                episodeOffset: 0,                  // no offset for real seasons
            }));

        // ── AniList enrichment: only when TMDB has exactly 1 season ──────────
        if (seasons.length === 1 && seasons[0].episodeCount > 1) {
            try {
                const aniRoot = await searchAniList(tv.name || tv.original_name);
                if (aniRoot && aniRoot.episodes) {
                    const chain = await collectSequelChain(aniRoot);
                    // Only enrich if AniList found multiple entries in the chain
                    if (chain.length > 1) {
                        const virtual = buildVirtualSeasons(seasons[0], chain, seasons[0].episodeCount);
                        if (virtual.length > 1) {
                            seasons = virtual;
                        }
                    }
                }
            } catch {
                // AniList failed — fall back to TMDB seasons as-is
            }
        }

        const cast = (tv.credits?.cast || []).slice(0, 20).map((c: any) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path ? `${TMDB_IMG}/w185${c.profile_path}` : null,
        }));

        const similar = (tv.similar?.results || []).slice(0, 12).map((s: any) => ({
            tmdbId: s.id,
            title: s.name,
            posterUrl: s.poster_path ? `${TMDB_IMG}/w300${s.poster_path}` : null,
            rating: s.vote_average,
            year: (s.first_air_date || '').slice(0, 4),
        }));

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({
            tmdbId: tv.id,
            imdbId: ext.imdb_id || null,
            title: tv.name,
            originalTitle: tv.original_name,
            description: tv.overview,
            image: tv.poster_path ? `${TMDB_IMG}/w500${tv.poster_path}` : null,
            backdropUrl: tv.backdrop_path ? `${TMDB_IMG}/w1280${tv.backdrop_path}` : null,
            rating: tv.vote_average,
            status: tv.status,
            genres: (tv.genres || []).map((g: any) => g.name),
            releaseDate: tv.first_air_date,
            totalEpisodes: tv.number_of_episodes,
            totalSeasons: seasons.length,
            seasons,
            cast,
            similar,
        });
    } catch (err: any) {
        console.error('[tmdb-info]', err?.message);
        return res.status(500).json({ error: 'Failed to fetch anime info' });
    }
}
