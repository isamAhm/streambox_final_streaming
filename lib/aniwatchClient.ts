/**
 * lib/aniwatchClient.ts
 *
 * Direct HTTP client for aniwatchtv.to — bypasses the aniwatch package's
 * axios instance which gets rate-limited / blocked by Cloudflare.
 *
 * All requests use browser-like headers that the site accepts.
 */

import { load } from 'cheerio';
import axios from 'axios';

const BASE = 'https://aniwatchtv.to';
const MEGACLOUD_BASE = 'https://megacloud.blog';
const KEYS_URL = 'https://raw.githubusercontent.com/yogesh-hacker/yogesh-hacker/refs/heads/main/yogesh-hacker/Megacloud/keys.json';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': `${BASE}/`,
};

async function get(url: string, extraHeaders: Record<string, string> = {}): Promise<any> {
    const res = await axios.get(url, { headers: { ...HEADERS, ...extraHeaders } });
    return res.data;
}

// ── Episodes ────────────────────────────────────────────────────────────────

export interface Episode {
    episodeId: string;   // "slug?ep=12345"
    number: number;
    title: string;
    isFiller: boolean;
}

export async function getEpisodes(animeSlug: string): Promise<Episode[]> {
    // Extract numeric ID from slug (last hyphen-separated segment)
    const numericId = animeSlug.split('-').pop();
    const data = await get(
        `${BASE}/ajax/v2/episode/list/${numericId}`,
        { Referer: `${BASE}/${animeSlug}` }
    );
    const $ = load(data.html as string);
    const episodes: Episode[] = [];
    $('.ep-item').each((_i, el) => {
        const epId = $(el).attr('data-id');
        const number = parseInt($(el).attr('data-number') || '0');
        const title = $(el).find('.ep-name').text().trim() || `Episode ${number}`;
        const isFiller = $(el).hasClass('ssl-item-filler');
        if (epId) {
            episodes.push({
                episodeId: `${animeSlug}?ep=${epId}`,
                number,
                title,
                isFiller,
            });
        }
    });
    return episodes;
}

// ── Servers ─────────────────────────────────────────────────────────────────

export interface ServerEntry {
    serverName: string;
    serverId: number;
    type: 'sub' | 'dub' | 'raw';
}

export async function getEpisodeServers(episodeId: string): Promise<{ sub: ServerEntry[]; dub: ServerEntry[] }> {
    const epNumericId = episodeId.split('?ep=')[1];
    const data = await get(`${BASE}/ajax/v2/episode/servers?episodeId=${epNumericId}`);
    const $ = load(data.html as string);

    const parse = (type: 'sub' | 'dub'): ServerEntry[] => {
        const entries: ServerEntry[] = [];
        $(`.server-item[data-type="${type}"]`).each((_i, el) => {
            const serverId = parseInt($(el).attr('data-id') || '0');
            const serverName = $(el).find('a').text().trim().toLowerCase();
            if (serverId) entries.push({ serverName, serverId, type });
        });
        return entries;
    };

    return { sub: parse('sub'), dub: parse('dub') };
}

// ── Embed link ───────────────────────────────────────────────────────────────

export async function getEmbedLink(serverId: number): Promise<string> {
    const data = await get(`${BASE}/ajax/v2/episode/sources?id=${serverId}`);
    if (!data?.link) throw new Error('Empty embed link from sources endpoint');
    return data.link as string;
}

// ── MegaCloud extraction ─────────────────────────────────────────────────────

export interface ExtractedSource {
    url: string;
    isM3U8: boolean;
    quality?: string;
}

export interface ExtractedData {
    sources: ExtractedSource[];
    subtitles: { url: string; lang: string; default: boolean }[];
}

async function getMegaCloudClientKey(sourceId: string): Promise<string> {
    const { data: html } = await axios.get<string>(
        `${MEGACLOUD_BASE}/embed-2/v3/e-1/${sourceId}`,
        { headers: { 'Referer': `${BASE}/`, 'User-Agent': HEADERS['User-Agent'] } }
    );

    // Pattern 1: window._lk_db = {x: "...", y: "...", z: "..."}  → concatenate x+y+z
    const lkDb = html.match(/window\._lk_db\s*=\s*\{[xyz]:\s*["']([a-zA-Z0-9]+)["'],\s*[xyz]:\s*["']([a-zA-Z0-9]+)["'],\s*[xyz]:\s*["']([a-zA-Z0-9]+)["']\}/);
    if (lkDb) return lkDb[1] + lkDb[2] + lkDb[3];

    // Pattern 2: <!-- _is_th:KEY -->
    const isth = html.match(/<!--\s+_is_th:([0-9a-zA-Z]+)\s+-->/);
    if (isth?.[1]) return isth[1];

    // Pattern 3: window._xy_ws = 'KEY'
    const xyw = html.match(/window\._xy_ws\s*=\s*['"`]([0-9a-zA-Z]+)['"`]/);
    if (xyw?.[1]) return xyw[1];

    // Pattern 4: <meta name="_gg_fb" content="KEY">
    const ggfb = html.match(/<meta name="_gg_fb" content="([a-zA-Z0-9]+)">/);
    if (ggfb?.[1]) return ggfb[1];

    // Pattern 5: <div data-dpi="KEY"
    const dpi = html.match(/<div\s+data-dpi="([0-9a-zA-Z]+)"/);
    if (dpi?.[1]) return dpi[1];

    // Pattern 6: <script nonce="KEY">
    const nonce = html.match(/<script nonce="([0-9a-zA-Z]+)"/);
    if (nonce?.[1]) return nonce[1];

    throw new Error('Could not extract MegaCloud client key from embed page');
}

// Ported from aniwatch dist — AES-based decryption
function keygen(megaKey: string, clientKey: string): string {
    const tempKey = megaKey + clientKey;
    const leafStr = clientKey.split('').reverse().join('');
    let result = '';
    for (let i = 0; i < tempKey.length; i++) {
        const c1 = tempKey.charCodeAt(i);
        const c2 = leafStr.charCodeAt(i % leafStr.length);
        result += String.fromCharCode(((c1 + c2) % 95) + 32);
    }
    return result;
}

function decryptSources(encrypted: string, clientKey: string, megaKey: string): string {
    const genKey = keygen(megaKey, clientKey);
    const decoded = atob(encrypted);
    const chars = [...Array(95)].map((_, i) => String.fromCharCode(32 + i));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        const c = decoded.charCodeAt(i);
        const keyChar = genKey.charCodeAt(i % genKey.length);
        const idx = chars.indexOf(String.fromCharCode(c));
        if (idx === -1) { result += String.fromCharCode(c); continue; }
        const keyIdx = chars.indexOf(String.fromCharCode(keyChar));
        result += chars[((idx - keyIdx + 95) % 95)];
    }
    return result;
}

export async function extractMegaCloud(embedUrl: string): Promise<ExtractedData> {
    const sourceId = /\/([^\/\?]+)\?/.exec(embedUrl)?.[1];
    if (!sourceId) throw new Error('Cannot extract sourceId from embed URL: ' + embedUrl);

    const [clientKey, keysData] = await Promise.all([
        getMegaCloudClientKey(sourceId),
        axios.get(KEYS_URL).then(r => r.data),
    ]);

    const megaKey: string = keysData.mega;
    if (!megaKey) throw new Error('MegaCloud decryption key not found in keys.json');

    const { data: rawData } = await axios.get(
        `${MEGACLOUD_BASE}/embed-2/v3/e-1/getSources?id=${sourceId}&_k=${clientKey}`,
        { headers: { 'Referer': `${MEGACLOUD_BASE}/`, 'User-Agent': HEADERS['User-Agent'] } }
    );

    let parsedSources: any[];
    if (!rawData.encrypted) {
        parsedSources = rawData.sources || [];
    } else {
        const decrypted = decryptSources(rawData.sources, clientKey, megaKey);
        parsedSources = JSON.parse(decrypted);
    }

    return {
        sources: parsedSources.map((s: any) => ({
            url: s.file,
            isM3U8: s.type === 'hls' || s.file?.includes('.m3u8'),
            quality: s.label || 'auto',
        })),
        subtitles: (rawData.tracks || [])
            .filter((t: any) => t.kind === 'captions')
            .map((t: any) => ({ url: t.file, lang: t.label || t.kind, default: t.default || false })),
    };
}
