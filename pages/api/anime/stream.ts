/**
 * Anime stream API — aniwatchtv.to
 * Returns all available embed URLs (VidSrc, MegaCloud, T-Cloud).
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getEpisodeServers, getEmbedLink } from '@/lib/aniwatchClient';
import { cache } from '@/lib/cache';

const STREAM_CACHE_TTL = 5 * 60 * 1000; // 5 min — embed IDs rotate frequently
const TIMEOUT_MS = 12000;
const SERVER_PRIORITY = ['vidsrc', 'megacloud', 't-cloud'];

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { episodeId, dub } = req.query as { episodeId: string; dub?: string };
    if (!episodeId || !episodeId.includes('?ep=')) {
        return res.status(400).json({ error: 'Invalid episodeId. Expected: slug?ep=12345' });
    }

    const category: 'sub' | 'dub' = dub === 'true' ? 'dub' : 'sub';
    const cacheKey = `aw:embed:${episodeId}:${category}`;
    const cached = cache.get<object>(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        const servers = await withTimeout(getEpisodeServers(episodeId), TIMEOUT_MS);
        const available = (servers[category]?.length ? servers[category] : servers.sub) || [];

        if (!available.length) throw new Error('No servers available');

        // Fetch embed links for all servers in parallel
        const sorted = SERVER_PRIORITY
            .map(name => available.find(s => s.serverName.toLowerCase().includes(name)))
            .filter(Boolean) as typeof available;

        // Also include any servers not in our priority list
        for (const s of available) {
            if (!sorted.includes(s)) sorted.push(s);
        }

        const results = await Promise.allSettled(
            sorted.map(async entry => {
                const embedUrl = await withTimeout(getEmbedLink(entry.serverId), TIMEOUT_MS);
                return { server: entry.serverName, embedUrl };
            })
        );

        const servers_out = results
            .filter((r): r is PromiseFulfilledResult<{ server: string; embedUrl: string }> => r.status === 'fulfilled')
            .map(r => {
                const { server, embedUrl } = r.value;
                // Use relative URL — works on any domain without needing APP_URL
                const proxied = `/api/anime/embed-proxy?url=${encodeURIComponent(embedUrl)}`;
                return { server, embedUrl: proxied };
            });

        if (!servers_out.length) throw new Error('All servers failed to return embed links');

        const result = { type: 'embed' as const, servers: servers_out };
        cache.set(cacheKey, result, STREAM_CACHE_TTL);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json(result);
    } catch (err: any) {
        const isTimeout = err?.message === 'timeout';
        console.error('[stream] Fatal:', err?.message);
        return res.status(isTimeout ? 504 : 500).json({
            error: isTimeout ? 'Stream timed out. Try again.' : 'Failed to fetch stream',
            detail: err?.message,
        });
    }
}
