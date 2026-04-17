/**
 * /api/anime/embed?serverId=123
 * Fetches the embed URL from aniwatchtv.to server-side.
 * No caching — embed URLs are session-scoped and must be fresh per request.
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { getEmbedLink } from '@/lib/aniwatchClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { serverId } = req.query as { serverId: string };
    if (!serverId || isNaN(parseInt(serverId))) {
        return res.status(400).json({ error: 'Invalid serverId' });
    }

    try {
        const embedUrl = await getEmbedLink(parseInt(serverId));
        // Wrap through our proxy so MegaCloud sees aniwatchtv.to as the origin
        const proxiedUrl = `/api/anime/megacloud-proxy?url=${encodeURIComponent(embedUrl)}`;
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ embedUrl: proxiedUrl });
    } catch (err: any) {
        console.error('[embed]', err?.message);
        return res.status(500).json({ error: 'Failed to get embed URL' });
    }
}
