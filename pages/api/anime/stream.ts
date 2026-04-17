/**
 * Anime stream API — uses the same providers as movies/TV (VidSrc, VidKing etc.)
 * These work with IMDB IDs which anime shows have.
 * Falls back to megaplay.buzz using AniList ID if no IMDB ID available.
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { imdbId, tmdbId, ep, season, dub, anilistId, episodeId } = req.query as {
        imdbId?: string;
        tmdbId?: string;
        ep?: string;
        season?: string;
        dub?: string;
        anilistId?: string;
        episodeId?: string;
    };

    const epNum = ep || '1';
    const seasonNum = season || '1';
    const servers: { name: string; embedUrl: string }[] = [];

    if (imdbId) {
        const fullId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
        servers.push(
            { name: 'VidSrc', embedUrl: `https://vidsrc.to/embed/tv/${fullId}/${seasonNum}/${epNum}` },
            { name: 'VidSrc.xyz', embedUrl: `https://vidsrc.xyz/embed/tv/${fullId}/${seasonNum}/${epNum}` },
            { name: 'VidSrc.me', embedUrl: `https://vidsrc.me/embed/tv?imdb=${fullId}&season=${seasonNum}&episode=${epNum}` },
            { name: '2Embed', embedUrl: `https://www.2embed.cc/embedtv/${fullId}&s=${seasonNum}&e=${epNum}` },
        );
    }

    if (tmdbId) {
        servers.push({
            name: 'VidKing',
            embedUrl: `https://www.vidking.net/embed/tv/${tmdbId}/${seasonNum}/${epNum}?color=3B82F6&autoPlay=true`,
        });
    }

    // Fallback: megaplay.buzz using AniList ID (no IMDB needed)
    if (anilistId && epNum) {
        const lang = dub === 'true' ? 'dub' : 'sub';
        servers.push({
            name: 'MegaPlay',
            embedUrl: `https://megaplay.buzz/stream/ani/${anilistId}/${epNum}/${lang}`,
        });
    }

    // Also add megaplay using aniwatch episode ID if available
    if (episodeId && episodeId.includes('?ep=')) {
        const epNumericId = episodeId.split('?ep=')[1];
        const lang = dub === 'true' ? 'dub' : 'sub';
        servers.push({
            name: 'MegaPlay 2',
            embedUrl: `https://megaplay.buzz/stream/s-2/${epNumericId}/${lang}`,
        });
    }

    if (!servers.length) {
        return res.status(400).json({ error: 'imdbId, tmdbId, or anilistId required' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ servers });
}
