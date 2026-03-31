/**
 * Anime stream API — extracts direct m3u8 sources from aniwatchtv.to
 * via MegaCloud server-side extraction. Falls back to embed URL if extraction fails.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getEpisodeServers, getEmbedLink, extractMegaCloud } from '@/lib/aniwatchClient';
import { cache } from '@/lib/cache';

const STREAM_CACHE_TTL = 10 * 60 * 1000; // 10 min
const TIMEOUT_MS = 15000;
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
    const cacheKey = `aw:m3u8:${episodeId}:${category}`;
    const cached = cache.get<object>(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        const servers = await withTimeout(getEpisodeServers(episodeId), TIMEOUT_MS);
        const available = (servers[category]?.length ? servers[category] : servers.sub) || [];
        if (!available.length) throw new Error('No servers available');

        const sorted = SERVER_PRIORITY
            .map(name => available.find(s => s.serverName.toLowerCase().includes(name)))
            .filter(Boolean) as typeof available;
        for (const s of available) { if (!sorted.includes(s)) sorted.push(s); }

        let lastError: Error | null = null;

        for (const entry of sorted) {
            try {
                const embedUrl = await withTimeout(getEmbedLink(entry.serverId), TIMEOUT_MS);
                const extracted = await withTimeout(extractMegaCloud(embedUrl), TIMEOUT_MS);

                if (!extracted.sources.length) throw new Error('No sources extracted');

                const result = {
                    type: 'hls' as const,
                    sources: extracted.sources.map(s => ({
                        ...s,
                        // Proxy m3u8 through our server so the CDN gets the correct Referer
                        url: `/api/anime/proxy?url=${encodeURIComponent(s.url)}`,
                    })),
                    subtitles: extracted.subtitles,
                    server: entry.serverName,
                };

                cache.set(cacheKey, result, STREAM_CACHE_TTL);
                res.setHeader('Cache-Control', 'no-store');
                return res.status(200).json(result);
            } catch (err: any) {
                console.warn(`[stream] ${entry.serverName} failed: ${err.message}`);
                lastError = err;
            }
        }

        throw lastError || new Error('All servers failed');
    } catch (err: any) {
        const isTimeout = err?.message === 'timeout';
        console.error('[stream] Fatal:', err?.message);
        return res.status(isTimeout ? 504 : 500).json({
            error: isTimeout ? 'Stream timed out. Try again.' : 'Failed to fetch stream',
            detail: err?.message,
        });
    }
}
