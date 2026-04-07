import { NextApiRequest, NextApiResponse } from 'next';

const PROXY_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FETCH_TIMEOUT_MS = 15000;

function getReferer(hostname: string): string {
    // animepahe image CDN needs animepahe.si as referer
    if (hostname.includes('animepahe')) return 'https://animepahe.si/';
    // All AnimePahe video CDNs (uwucdn, owocdn, and any future ones) need kwik.cx
    // Default to kwik.cx for any unknown CDN — it's the universal AnimePahe referer
    return 'https://kwik.cx/';
}

async function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.query as { url: string };
    if (!url) return res.status(400).end();

    let targetUrl: string;
    try {
        targetUrl = decodeURIComponent(url);
        new URL(targetUrl);
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    const targetHost = new URL(targetUrl).hostname;
    const referer = getReferer(targetHost);

    try {
        const upstream = await fetchWithTimeout(targetUrl, {
            headers: {
                'Referer': referer,
                'Origin': referer.replace(/\/$/, ''),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        }, FETCH_TIMEOUT_MS);

        if (!upstream.ok) return res.status(upstream.status).end();

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=300');

        if (targetUrl.endsWith('.key')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        } else if (targetUrl.endsWith('.m3u8') || contentType.includes('mpegurl')) {
            // handled below
        } else {
            // Force binary for all segments regardless of CDN content-type
            // AnimePahe serves .jpg segments with image/jpeg — must override
            res.setHeader('Content-Type', 'application/octet-stream');
        }

        // Rewrite m3u8 manifests
        if (targetUrl.endsWith('.m3u8') || contentType.includes('mpegurl')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            const text = await upstream.text();
            const base = new URL(targetUrl);

            const rewritten = text.split('\n').map((line) => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                if (trimmed.startsWith('#EXT-X-KEY')) {
                    return trimmed.replace(/URI="([^"]+)"/, (_, keyUrl) => {
                        try {
                            const absKey = new URL(keyUrl, base).toString();
                            return `URI="${PROXY_BASE}/api/anime/proxy?url=${encodeURIComponent(absKey)}"`;
                        } catch {
                            return `URI="${keyUrl}"`;
                        }
                    });
                }

                if (trimmed.startsWith('#')) return line;

                try {
                    const segUrl = new URL(trimmed, base).toString();
                    return `${PROXY_BASE}/api/anime/proxy?url=${encodeURIComponent(segUrl)}`;
                } catch {
                    return line;
                }
            }).join('\n');

            return res.status(200).send(rewritten);
        }

        const buffer = await upstream.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            console.error('Proxy timeout:', targetUrl.slice(0, 80));
            return res.status(504).json({ error: 'Upstream timeout' });
        }
        console.error('Proxy error:', error?.message);
        return res.status(502).end();
    }
}

export const config = {
    api: { responseLimit: false },
};
