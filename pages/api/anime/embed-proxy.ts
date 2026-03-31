/**
 * Full embed proxy — fetches MegaCloud embed resources server-side with
 * the correct Referer (aniwatchtv.to), then rewrites URLs in HTML and JS
 * so all subsequent requests also go through this proxy.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const ALLOWED_HOSTS = ['megacloud.blog', 'megacloud.tv', 'rapid-cloud.co'];
const ANIWATCH_REFERER = 'https://aniwatchtv.to/';

const XHR_INTERCEPT = `
<script>
(function() {
  var PROXY = '/api/anime/embed-proxy?url=';
  var HOSTS = ['megacloud.blog', 'megacloud.tv', 'rapid-cloud.co'];
  function shouldProxy(url) {
    try { return HOSTS.some(h => new URL(url).hostname === h); } catch(e) { return false; }
  }
  // Intercept fetch
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : input.url;
    if (shouldProxy(url)) {
      var proxied = PROXY + encodeURIComponent(url);
      input = typeof input === 'string' ? proxied : new Request(proxied, input);
    }
    return origFetch.call(this, input, init);
  };
  // Intercept XHR
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && shouldProxy(url)) {
      url = PROXY + encodeURIComponent(url);
    }
    return origOpen.apply(this, [method, url].concat(Array.prototype.slice.call(arguments, 2)));
  };
})();
</script>
`;
function rewrite(text: string, baseOrigin: string, isHtml: boolean): string {
    const proxify = (url: string) => `/api/anime/embed-proxy?url=${encodeURIComponent(url)}`;
    let out = text;

    // Absolute URLs on allowed hosts inside quotes
    out = out.replace(
        /(["'])(https?:\/\/(?:megacloud\.blog|megacloud\.tv|rapid-cloud\.co)\/[^"']*)(["'])/g,
        (_, q1, url, q2) => `${q1}${proxify(url)}${q2}`
    );

    // Root-relative URLs in HTML src/href attributes
    if (isHtml) {
        out = out.replace(
            /(src|href|action)="(\/[^"]+)"/g,
            (_, attr, path) => `${attr}="${proxify(`${baseOrigin}${path}`)}"`
        );
    }

    return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { url } = req.query as { url: string };
    if (!url) return res.status(400).end();

    let target: URL;
    try {
        target = new URL(decodeURIComponent(url));
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    if (!ALLOWED_HOSTS.includes(target.hostname)) {
        return res.status(403).json({ error: 'Host not allowed' });
    }

    try {
        const response = await axios.get(target.toString(), {
            headers: {
                'Referer': ANIWATCH_REFERER,
                'Origin': 'https://aniwatchtv.to',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            responseType: 'arraybuffer',
            timeout: 12000,
        });

        const contentType = (response.headers['content-type'] || 'application/octet-stream') as string;
        const baseOrigin = `${target.protocol}//${target.host}`;

        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Content-Security-Policy', 'frame-ancestors *');

        if (contentType.includes('text/html')) {
            let html = Buffer.from(response.data).toString('utf-8');
            // Inject XHR/fetch interceptor before any other scripts run
            html = html.replace('<head>', '<head>' + XHR_INTERCEPT);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(rewrite(html, baseOrigin, true));
        }

        if (contentType.includes('javascript')) {
            const js = Buffer.from(response.data).toString('utf-8');
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            return res.status(200).send(rewrite(js, baseOrigin, false));
        }

        // Binary / CSS / images — pass through as-is
        res.setHeader('Content-Type', contentType);
        return res.status(200).send(Buffer.from(response.data));
    } catch (err: any) {
        console.error('[embed-proxy]', err?.message);
        return res.status(502).end();
    }
}

export const config = {
    api: { responseLimit: false },
};
