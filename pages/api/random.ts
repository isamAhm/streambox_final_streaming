import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_IMG = 'https://image.tmdb.org/t/p';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    await serverAuth(req);
  } catch {
    return res.status(401).end();
  }

  try {
    // 1. Fetch TMDB trending today (movies + TV combined)
    let tmdbItems: any[] = [];
    if (TMDB_KEY) {
      const [movRes, tvRes] = await Promise.allSettled([
        fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_KEY}`, {
          signal: AbortSignal.timeout(5000),
        }),
        fetch(`https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_KEY}`, {
          signal: AbortSignal.timeout(5000),
        }),
      ]);

      if (movRes.status === 'fulfilled' && movRes.value.ok) {
        const d = await movRes.value.json();
        tmdbItems.push(...(d.results || []).slice(0, 10).map((m: any) => ({
          tmdbId: m.id,
          title: m.title || m.name,
          description: m.overview,
          backdropUrl: m.backdrop_path ? `${TMDB_IMG}/w1280${m.backdrop_path}` : null,
          thumbnailUrl: m.poster_path ? `${TMDB_IMG}/w500${m.poster_path}` : null,
          mediaType: 'movie',
        })));
      }
      if (tvRes.status === 'fulfilled' && tvRes.value.ok) {
        const d = await tvRes.value.json();
        tmdbItems.push(...(d.results || []).slice(0, 10).map((t: any) => ({
          tmdbId: t.id,
          title: t.name || t.title,
          description: t.overview,
          backdropUrl: t.backdrop_path ? `${TMDB_IMG}/w1280${t.backdrop_path}` : null,
          thumbnailUrl: t.poster_path ? `${TMDB_IMG}/w500${t.poster_path}` : null,
          mediaType: 'tv',
        })));
      }
    }

    // 2. Filter to items that have a backdrop (needed for billboard display)
    const withBackdrop = tmdbItems.filter(i => i.backdropUrl);
    const pool = withBackdrop.length > 0 ? withBackdrop : tmdbItems;

    if (pool.length === 0) {
      // Final fallback: use DB
      const dbFallback = await prismadb.movie.findMany({
        where: { popularity: { gt: 0 }, thumbnailUrl: { not: '' } },
        orderBy: { popularity: 'desc' },
        take: 10,
      });
      if (dbFallback.length === 0) return res.status(404).end();
      const pick = dbFallback[Math.floor(Math.random() * dbFallback.length)];
      return res.status(200).json(pick);
    }

    // 3. Pick one randomly from TMDB trending
    const tmdbPick = pool[Math.floor(Math.random() * pool.length)];

    // 4. Try to find a matching DB record by tmdbId for full feature support
    //    (InfoModal, PlayButton, trailer API all work better with a DB id)
    const dbMatch = tmdbPick.tmdbId
      ? await prismadb.movie.findFirst({
        where: { tmdbId: Number(tmdbPick.tmdbId) },
      })
      : null;

    if (dbMatch) {
      // Return DB record but override backdrop with fresh TMDB image if DB one is missing/stale
      const freshBackdrop = tmdbPick.backdropUrl || dbMatch.backdropUrl;
      if (freshBackdrop && freshBackdrop !== dbMatch.backdropUrl) {
        // Update DB in background (don't await — don't block the response)
        prismadb.movie.update({
          where: { id: dbMatch.id },
          data: { backdropUrl: freshBackdrop },
        }).catch(() => { });
      }
      return res.status(200).json({ ...dbMatch, backdropUrl: freshBackdrop });
    }

    // 5. Return TMDB item directly — Billboard will show backdrop + title/desc
    //    Trailer fetch will fail gracefully (no DB id), backdrop image still shows
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      id: `tmdb-${tmdbPick.tmdbId}`,
      title: tmdbPick.title,
      description: tmdbPick.description,
      backdropUrl: tmdbPick.backdropUrl,
      thumbnailUrl: tmdbPick.thumbnailUrl,
      tmdbId: String(tmdbPick.tmdbId),
      mediaType: tmdbPick.mediaType,
    });
  } catch (err: any) {
    console.error('[/api/random]', err?.message);
    return res.status(500).end();
  }
}
