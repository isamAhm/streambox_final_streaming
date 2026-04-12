/**
 * Anime stream API — returns server IDs only.
 * The browser fetches embed URLs directly from aniwatchtv.to
 * so MegaCloud sees the user's IP (not Vercel's), preventing "file not found".
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getEpisodeServers } from '@/lib/aniwatchClient';
import { cache } from '@/lib/cache';

const SERVERS_CACHE_TTL = 20 * 60 * 1000;
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
    const cacheKey = `aw:servers:${episodeId}:${category}`;
    const cached = cache.get<object>(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        const servers = await withTimeout(getEpisodeServers(episodeId), TIMEOUT_MS);
        const available = (servers[category]?.length ? servers[category] : servers.sub) || [];

        if (!available.length) throw new Error('No servers available');

        // Sort by priority, return server IDs — browser will fetch embed URLs directly
        const sorted = [
            ...SERVER_PRIORITY
                .map(name => available.find(s => s.serverName.toLowerCase().includes(name)))
                .filter(Boolean),
            ...available.filter(s => !SERVER_PRIORITY.some(p => s.serverName.toLowerCase().includes(p))),
        ] as typeof available;

        const result = {
            servers: sorted.map(s => ({
                name: s.serverName,
                serverId: s.serverId,
            })),
        };

        cache.set(cacheKey, result, SERVERS_CACHE_TTL);
        // No-cache on the response — embed URLs are session-scoped
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json(result);
    } catch (err: any) {
        const isTimeout = err?.message === 'timeout';
        console.error('[stream] Fatal:', err?.message);
        return res.status(isTimeout ? 504 : 500).json({
            error: isTimeout ? 'Stream timed out. Try again.' : 'Failed to fetch stream',
        });
    }
}
