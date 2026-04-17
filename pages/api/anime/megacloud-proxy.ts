/**
 * /api/anime/megacloud-proxy?url=<encoded_megacloud_embed_url>
 *
 * Proxies the MegaCloud embed page with the correct Origin/Referer headers
 * so MegaCloud doesn't block it based on the user's domain.
 */
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { url } = req.query as { url: string };
    if (!url) return res.status(400).json({ error: 'url required' });

    let targetUrl: string;
    try {
        targetUrl = decodeURIComponent(url);
        new URL(targetUrl); // validate
        if (!targetUrl.includes('megacloud.blog')) {
            return res.status(400).json({ error: 'Invalid URL' });
        }
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const { data, headers } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://aniwatchtv.to/',
                'Origin': 'https://aniwatchtv.to',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            responseType: 'text',
            timeout: 10000,
        });

        // Rewrite absolute URLs in the HTML to go through our proxy or be absolute
        const baseUrl = new URL(targetUrl);
        const rewritten = (data as string)
            // Fix relative src/href to be absolute megacloud.blog URLs
            .replace(/(src|href)="\/([^"]+)"/g, `$1="https://megacloud.blog/$2"`)
            // Fix relative src/href with ./ prefix
            .replace(/(src|href)="\.\//g, `$1="https://megacloud.blog/`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        // Allow the page to run scripts and load resources
        res.setHeader('Content-Security-Policy', '');
        res.setHeader('X-Frame-Options', '');
        return res.status(200).send(rewritten);
    } catch (err: any) {
        console.error('[megacloud-proxy]', err?.message);
        return res.status(502).json({ error: 'Failed to proxy embed' });
    }
}
