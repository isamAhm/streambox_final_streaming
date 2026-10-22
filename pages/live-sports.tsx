import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ApiTeam {
    name?: string;
    badge?: string;
}

interface ApiMatch {
    id: string;
    title: string;
    category: string;
    date: number;
    poster?: string;
    popular?: boolean;
    teams?: { home?: ApiTeam; away?: ApiTeam };
    sources?: { source: string; id: string }[];
    [key: string]: any;
}

interface Stream {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source: string;
}

interface CdnChannel {
    channel_name: string;
    channel_code: string;
    viewers: string;
    url: string;
    image: string;
}

interface CdnEvent {
    sport: string;
    gameID: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamIMG: string;
    awayTeamIMG: string;
    tournament: string;
    country: string;
    status: Status;
    start: string;
    channels: CdnChannel[];
}

type Status = 'live' | 'upcoming' | 'finished';
type StatusFilter = 'all' | 'live' | 'today' | 'upcoming' | 'finished';
type ServerGroup = 'streamed' | 'cdn';

interface TeamInfo {
    name?: string;
    img?: string;
}

interface Game {
    id: string;
    title: string;
    sport: string;
    date: Date;
    status: Status;
    popular: boolean;
    home?: TeamInfo;
    away?: TeamInfo;
    sources: { source: string; id: string }[]; // Streamed (Server 1)
    cdnChannels: CdnChannel[];                 // CDN Live TV (Server 2)
    league: string;
}

interface LeagueGroup {
    id: string;
    name: string;
    sport: string;
    priority: number;
    games: Game[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

// If the browser blocks requests (CORS), point this at your own proxy route instead.
const API_BASE = 'https://streamed.pk';
const CDN_URL = 'https://api.cdnlivetv.is/api/v1/events/sports/?user=cdnlivetv&plan=free';

const TOP_THRESHOLD = 40;
const MAX_GAME_MS = 3 * 60 * 60 * 1000;
const MATCH_WINDOW_MS = 12 * 60 * 60 * 1000;

const SPORT_EMOJIS: Record<string, string> = {
    football: '⚽', basketball: '🏀', 'american-football': '🏈', hockey: '🏒',
    baseball: '⚾', tennis: '🎾', mma: '🥋', boxing: '🥊', fight: '🥊',
    'motor-sports': '🏎️', golf: '⛳', cricket: '🏏', rugby: '🏉', darts: '🎯',
    billiards: '🎱', afl: '🏉', volleyball: '🏐', other: '🏆',
};

const SPORT_ORDER = [
    'football', 'basketball', 'american-football', 'hockey', 'tennis', 'mma',
    'boxing', 'fight', 'baseball', 'motor-sports', 'cricket', 'rugby', 'golf',
];

const SPORT_GROUP_PRIORITY: Record<string, number> = {
    basketball: 2, 'american-football': 2, hockey: 3, mma: 3, boxing: 3,
    tennis: 4, baseball: 5, 'motor-sports': 3, cricket: 6, rugby: 6, golf: 6,
};

const STATUS_ORDER: Record<string, number> = { live: 0, upcoming: 1, finished: 2 };

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: '🔴 Live' },
    { key: 'today', label: '📅 Today' },
    { key: 'upcoming', label: '⏳ Upcoming' },
    { key: 'finished', label: '✅ Finished' },
];

/* ------------------------------------------------------------------ */
/* Club lists – used to guess the league when the API doesn't say      */
/* ------------------------------------------------------------------ */

const LEAGUES: { name: string; clubs: string[] }[] = [
    {
        name: 'Premier League',
        clubs: [
            'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'burnley', 'chelsea',
            'crystal palace', 'everton', 'fulham', 'leeds', 'leicester', 'liverpool', 'man city',
            'manchester city', 'man united', 'man utd', 'manchester united', 'newcastle',
            'nottingham forest', 'nott.? forest', 'sunderland', 'tottenham', 'spurs', 'west ham',
            'wolverhampton', 'wolves', 'ipswich', 'southampton',
        ],
    },
    {
        name: 'La Liga',
        clubs: [
            'real madrid', 'barcelona', 'atletico madrid', 'atletico', 'sevilla', 'real sociedad',
            'villarreal', 'athletic club', 'athletic bilbao', 'real betis', 'betis', 'valencia',
            'girona', 'celta vigo', 'celta', 'osasuna', 'getafe', 'rayo vallecano', 'mallorca',
            'alaves', 'espanyol', 'levante', 'elche', 'real oviedo', 'las palmas',
        ],
    },
    {
        name: 'Serie A',
        clubs: [
            'juventus', 'inter milan', 'internazionale', 'ac milan', 'milan', 'napoli', 'roma',
            'lazio', 'atalanta', 'fiorentina', 'bologna', 'torino', 'udinese', 'genoa', 'sassuolo',
            'cagliari', 'lecce', 'como', 'parma', 'hellas verona', 'cremonese', 'pisa',
        ],
    },
    {
        name: 'Bundesliga',
        clubs: [
            'bayern', 'dortmund', 'leverkusen', 'rb leipzig', 'leipzig', 'eintracht frankfurt',
            'frankfurt', 'stuttgart', 'wolfsburg', 'monchengladbach', 'gladbach', 'freiburg',
            'hoffenheim', 'werder bremen', 'union berlin', 'mainz', 'augsburg', 'heidenheim',
            'st pauli', 'st. pauli', 'koln', 'cologne', 'hamburger', 'hamburg',
        ],
    },
    {
        name: 'Ligue 1',
        clubs: [
            'paris saint', 'psg', 'marseille', 'lyon', 'monaco', 'lille', 'nice', 'lens', 'rennes',
            'strasbourg', 'nantes', 'toulouse', 'brest', 'auxerre', 'angers', 'le havre', 'metz',
            'lorient',
        ],
    },
    { name: 'Eredivisie', clubs: ['ajax', 'psv', 'feyenoord', 'az alkmaar', 'twente', 'utrecht'] },
    { name: 'Primeira Liga', clubs: ['benfica', 'porto', 'sporting cp', 'sporting lisbon', 'sporting', 'braga'] },
    { name: 'Süper Lig', clubs: ['galatasaray', 'fenerbahce', 'besiktas', 'trabzonspor', 'basaksehir'] },
    { name: 'Scottish Premiership', clubs: ['celtic', 'rangers', 'aberdeen', 'hearts', 'hibernian'] },
    {
        name: 'Other European Football',
        clubs: [
            'lask', 'bodo', 'glimt', 'slavia praha', 'slavia prague', 'sparta praha', 'sparta prague',
            'salzburg', 'sturm graz', 'club brugge', 'anderlecht', 'union saint', 'genk', 'shakhtar',
            'dynamo kyiv', 'dinamo zagreb', 'red star', 'crvena zvezda', 'young boys', 'basel',
            'olympiacos', 'panathinaikos', 'paok', 'aek athens', 'qarabag', 'ferencvaros', 'copenhagen',
            'kairat', 'pafos', 'maccabi', 'legia', 'rakow', 'malmo', 'viktoria plzen', 'sheriff',
            'ludogorets', 'lincoln red imps', 'apoel', 'omonia', 'hapoel', 'rapid wien', 'austria wien',
            'molde', 'brann', 'midtjylland', 'aalborg', 'brondby',
        ],
    },
];

const LEAGUE_MATCHERS = LEAGUES.map(l => ({
    name: l.name,
    regexes: l.clubs.map(c => new RegExp(`\\b${c}\\b`)),
}));

/* ------------------------------------------------------------------ */
/* League priority – LOWER number = shown HIGHER on the page           */
/* ------------------------------------------------------------------ */

const LEAGUE_RULES: { pattern: RegExp; score: number }[] = [
    { pattern: /world cup|euro(pean)? championship|nations league|copa america|africa cup/, score: 1 },
    { pattern: /champions league|uefa club/, score: 2 },
    { pattern: /premier league/, score: 3 },
    { pattern: /la\s?liga/, score: 4 },
    { pattern: /serie a/, score: 5 },
    { pattern: /bundesliga/, score: 6 },
    { pattern: /ligue 1/, score: 7 },
    { pattern: /europa league/, score: 8 },
    { pattern: /conference league/, score: 9 },
    { pattern: /fa cup/, score: 10 },
    { pattern: /efl cup|carabao|league cup/, score: 11 },
    { pattern: /libertadores/, score: 12 },
    { pattern: /copa del rey/, score: 12 },
    { pattern: /coppa italia/, score: 13 },
    { pattern: /dfb.?pokal/, score: 14 },
    { pattern: /coupe de france/, score: 15 },
    { pattern: /championship/, score: 17 },
    { pattern: /eredivisie/, score: 18 },
    { pattern: /primeira liga|liga portugal/, score: 19 },
    { pattern: /\bmls\b|major league soccer/, score: 20 },
    { pattern: /scottish premiership|premiership/, score: 20 },
    { pattern: /saudi/, score: 21 },
    { pattern: /s[uü]per lig/, score: 22 },
    { pattern: /\bnba\b|\bnfl\b|\bnhl\b|\bmlb\b|\bufc\b/, score: 1 },
];

const getLeaguePriority = (name: string): number => {
    const t = name.toLowerCase();
    for (const rule of LEAGUE_RULES) if (rule.pattern.test(t)) return rule.score;
    return 100;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const hideBrokenImage = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.visibility = 'hidden';
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const normalizeText = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const prettySport = (category: string) =>
    category
        .split(/[-_\s]+/)
        .map(w =>
            w.toLowerCase() === 'mma' || w.toLowerCase() === 'afl'
                ? w.toUpperCase()
                : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(' ');

const badgeUrl = (badge?: string) => (badge ? `${API_BASE}/api/images/badge/${badge}.webp` : '');

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const formatKickoff = (game: Game, now: Date) => {
    const time = game.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    let day: string;
    if (sameDay(game.date, now)) day = 'Today';
    else if (sameDay(game.date, tomorrow)) day = 'Tomorrow';
    else if (sameDay(game.date, yesterday)) day = 'Yesterday';
    else day = game.date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

    return { day, time };
};

const matchesStatus = (g: Game, filter: StatusFilter, now: Date): boolean => {
    switch (filter) {
        case 'live': return g.status === 'live';
        case 'today': return g.status === 'live' || sameDay(g.date, now);
        case 'upcoming': return g.status === 'upcoming';
        case 'finished': return g.status === 'finished';
        default: return true;
    }
};

const matchesSearch = (g: Game, q: string): boolean => {
    if (!q) return true;
    const haystack = normalizeText(
        [g.title, g.home?.name ?? '', g.away?.name ?? '', g.league, g.sport].join(' ')
    );
    return q.split(/\s+/).every(token => haystack.includes(token));
};

const sortGames = (a: Game, b: Game) => {
    const byStatus = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
    if (byStatus !== 0) return byStatus;
    const diff = a.date.getTime() - b.date.getTime();
    return a.status === 'finished' ? -diff : diff;
};

const sortSports = (keys: string[]) =>
    [...keys].sort((a, b) => {
        const ai = SPORT_ORDER.indexOf(a);
        const bi = SPORT_ORDER.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b);
    });

const liveCount = (g: LeagueGroup) => g.games.filter(x => x.status === 'live').length;

const serverCount = (g: Game) => (g.sources.length > 0 ? 1 : 0) + (g.cdnChannels.length > 0 ? 1 : 0);

/* ----- league detection (Streamed has no league field) ----- */

const teamLeague = (name?: string): string | null => {
    if (!name) return null;
    const n = normalizeText(name);
    for (const league of LEAGUE_MATCHERS) {
        if (league.regexes.some(r => r.test(n))) return league.name;
    }
    return null;
};

const detectLeague = (m: ApiMatch, category: string): string => {
    const fromApi = m.league ?? m.tournament ?? m.competition;
    if (typeof fromApi === 'string' && fromApi.trim()) return fromApi.trim();
    if (fromApi && typeof fromApi === 'object' && fromApi.name) return String(fromApi.name);

    if (category !== 'football') return prettySport(category);

    const home = teamLeague(m.teams?.home?.name);
    const away = teamLeague(m.teams?.away?.name);

    if (home && away) return home !== away ? 'UEFA Club Competitions' : home;
    return 'Other Football';
};

const normalizeStatus = (status: any): Status => {
    const s = String(status ?? '').toLowerCase();
    if (/live|in.?play|progress/.test(s)) return 'live';
    if (/finish|ended|complete|^ft$/.test(s)) return 'finished';
    return 'upcoming';
};

/* ------------------------------------------------------------------ */
/* Streamed (Server 1)                                                 */
/* ------------------------------------------------------------------ */

const fetchJson = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    return res.json();
};

const toGame = (m: ApiMatch, liveIds: Set<string>, liveKnown: boolean, now: number): Game => {
    const category = String(m.category ?? 'other').toLowerCase();
    const date = new Date(Number(m.date));
    const started = date.getTime() <= now;

    let status: Status;
    if (liveIds.has(String(m.id))) status = 'live';
    else if (!started) status = 'upcoming';
    else if (!liveKnown && now - date.getTime() < MAX_GAME_MS) status = 'live';
    else status = 'finished';

    return {
        id: String(m.id),
        title: m.title ?? '',
        sport: category,
        date,
        status,
        popular: !!m.popular,
        home: m.teams?.home ? { name: m.teams.home.name, img: badgeUrl(m.teams.home.badge) } : undefined,
        away: m.teams?.away ? { name: m.teams.away.name, img: badgeUrl(m.teams.away.badge) } : undefined,
        sources: Array.isArray(m.sources) ? m.sources : [],
        cdnChannels: [],
        league: detectLeague(m, category),
    };
};

/* ------------------------------------------------------------------ */
/* CDN Live TV (Server 2)                                              */
/* ------------------------------------------------------------------ */

const cdnSportSlug = (label: string): string => {
    const l = label.toLowerCase().trim();
    const map: Record<string, string> = {
        soccer: 'football', football: 'football',
        nba: 'basketball', basketball: 'basketball',
        nfl: 'american-football', 'american football': 'american-football',
        nhl: 'hockey', hockey: 'hockey',
        ufc: 'mma', mma: 'mma',
        motorsport: 'motor-sports', 'motor sports': 'motor-sports',
    };
    return map[l] ?? l.replace(/\s+/g, '-');
};

// CDN times look like "2025-11-21 15:30" and appear to be UTC
const parseCdnStart = (start: string): Date | null => {
    if (!start) return null;
    const trimmed = start.trim().replace(' ', 'T');
    const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(trimmed);
    const d = new Date(hasZone ? trimmed : `${trimmed}Z`);
    return isNaN(d.getTime()) ? null : d;
};

const isCdnEvent = (v: any): boolean =>
    !!v && typeof v === 'object' && ('homeTeam' in v || 'gameID' in v);

// Finds event arrays anywhere in the response, using the key (Soccer, NBA...) as the sport
function normalizeCdn(raw: any): CdnEvent[] {
    const out: CdnEvent[] = [];

    const push = (label: string, e: any) => {
        out.push({
            sport: cdnSportSlug(String(e.sport ?? e.category ?? label)),
            gameID: String(e.gameID ?? ''),
            homeTeam: e.homeTeam ?? e.home ?? '',
            awayTeam: e.awayTeam ?? e.away ?? '',
            homeTeamIMG: e.homeTeamIMG ?? '',
            awayTeamIMG: e.awayTeamIMG ?? '',
            tournament: String(e.tournament ?? '').trim(),
            country: String(e.country ?? '').trim(),
            status: normalizeStatus(e.status),
            start: e.start ?? '',
            channels: Array.isArray(e.channels) ? e.channels.filter((c: any) => c && c.url) : [],
        });
    };

    const visit = (node: any, label: string, depth: number) => {
        if (node == null || depth > 5) return;
        if (Array.isArray(node)) {
            node.filter(isCdnEvent).forEach(e => push(label || 'events', e));
            return;
        }
        if (typeof node === 'object') {
            for (const [key, value] of Object.entries(node)) visit(value, key, depth + 1);
        }
    };

    visit(raw, '', 0);
    return out;
}

const fetchCdn = async (): Promise<CdnEvent[]> => {
    const res = await fetch(CDN_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} (CDN Live TV)`);
    return normalizeCdn(await res.json());
};

/* ----- matching the same game across the two providers ----- */

const ALIASES: [RegExp, string][] = [
    [/\bman\.? ?city\b/g, 'manchester city'],
    [/\bman\.? ?(utd|united)\b/g, 'manchester united'],
    [/\bpsg\b/g, 'paris saint germain'],
    [/\bspurs\b/g, 'tottenham'],
    [/\bwolves\b/g, 'wolverhampton'],
    [/\bnott'?m? forest\b/g, 'nottingham forest'],
];

const STOP_TOKENS = new Set(['fc', 'cf', 'afc', 'sc', 'the', 'de', 'cd', 'ud', 'ac', 'as', 'sk', 'fk', 'bk']);

// Words shared by many different clubs – not enough on their own to call two teams the same
const GENERIC_TOKENS = new Set([
    'city', 'united', 'real', 'sporting', 'athletic', 'atletico', 'inter', 'dynamo', 'borussia',
    'saint', 'paris', 'manchester', 'madrid', 'milan', 'sport', 'club', 'town', 'rovers',
    'wanderers', 'albion', 'hotspur', 'racing', 'olympique', 'red', 'star',
]);

const teamTokens = (name?: string): string[] => {
    if (!name) return [];
    let n = normalizeText(name);
    ALIASES.forEach(([re, to]) => (n = n.replace(re, to)));
    return n
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter(t => t && !STOP_TOKENS.has(t));
};

const YOUTH_TAG = /^(women|womens|femenino|feminine|frauen|u\d{2}|ii|b|reserves?|youth)$/;

const teamsMatch = (a?: string, b?: string): boolean => {
    const ta = teamTokens(a);
    const tb = teamTokens(b);
    if (ta.length === 0 || tb.length === 0) return false;

    // Women's / youth / reserve teams must not match the senior side
    if (ta.some(t => YOUTH_TAG.test(t)) !== tb.some(t => YOUTH_TAG.test(t))) return false;

    if (ta.join(' ') === tb.join(' ')) return true;

    const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
    if (short.every(t => long.includes(t))) return true;

    return ta.some(t => t.length >= 4 && !GENERIC_TOKENS.has(t) && tb.includes(t));
};

const sameGame = (g: Game, c: CdnEvent): boolean => {
    if (g.sport !== c.sport) return false;
    if (!g.home?.name || !g.away?.name || !c.homeTeam || !c.awayTeam) return false;

    const start = parseCdnStart(c.start);
    if (start && Math.abs(start.getTime() - g.date.getTime()) > MATCH_WINDOW_MS) return false;

    return (
        (teamsMatch(g.home.name, c.homeTeam) && teamsMatch(g.away.name, c.awayTeam)) ||
        (teamsMatch(g.home.name, c.awayTeam) && teamsMatch(g.away.name, c.homeTeam))
    );
};

// Attach CDN channels to matching Streamed games; unmatched CDN events become games of their own
const mergeCdn = (games: Game[], cdn: CdnEvent[]): Game[] => {
    const merged = [...games];
    const originals = games.length;

    cdn.forEach((c, i) => {
        if (c.channels.length === 0) return;

        const target = games.slice(0, originals).find(g => sameGame(g, c));
        if (target) {
            target.cdnChannels = [...target.cdnChannels, ...c.channels];
            if (c.status === 'live') target.status = 'live';
            // CDN sends real tournament names, better than guessing from clubs
            if (c.tournament && target.sport === 'football') target.league = c.tournament;
            return;
        }

        merged.push({
            id: `cdn-${c.sport}-${c.gameID}-${i}`,
            title: `${c.homeTeam} vs ${c.awayTeam}`,
            sport: c.sport,
            date: parseCdnStart(c.start) ?? new Date(),
            status: c.status,
            popular: false,
            home: c.homeTeam ? { name: c.homeTeam, img: c.homeTeamIMG } : undefined,
            away: c.awayTeam ? { name: c.awayTeam, img: c.awayTeamIMG } : undefined,
            sources: [],
            cdnChannels: c.channels,
            league: c.tournament || prettySport(c.sport),
        });
    });

    return merged;
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const LiveSports = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [providers, setProviders] = useState({ streamed: true, cdn: true });
    const initialised = useRef(false);

    // Player state
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [serverGroup, setServerGroup] = useState<ServerGroup>('streamed');
    const [streams, setStreams] = useState<Stream[]>([]);
    const [streamsLoading, setStreamsLoading] = useState(false);
    const [streamIndex, setStreamIndex] = useState(0);
    const [cdnIndex, setCdnIndex] = useState(0);

    // Scroll refs and arrow visibility state
    const tabsRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const chipsRef = useRef<HTMLDivElement>(null);
    const streamsRef = useRef<HTMLDivElement>(null);
    const cdnRef = useRef<HTMLDivElement>(null);

    const [showTabsLeft, setShowTabsLeft] = useState(false);
    const [showTabsRight, setShowTabsRight] = useState(false);
    const [showStatusLeft, setShowStatusLeft] = useState(false);
    const [showStatusRight, setShowStatusRight] = useState(false);
    const [showChipsLeft, setShowChipsLeft] = useState(false);
    const [showChipsRight, setShowChipsRight] = useState(false);
    const [showStreamsLeft, setShowStreamsLeft] = useState(false);
    const [showStreamsRight, setShowStreamsRight] = useState(false);
    const [showCdnLeft, setShowCdnLeft] = useState(false);
    const [showCdnRight, setShowCdnRight] = useState(false);

    // Scroll handlers
    const handleScroll = useCallback((ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
        if (!ref.current) return;
        const scrollAmount = ref.current.clientWidth * 0.6;
        const newScrollLeft = direction === 'left'
            ? ref.current.scrollLeft - scrollAmount
            : ref.current.scrollLeft + scrollAmount;
        ref.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }, []);

    const checkScrollPosition = useCallback((
        ref: React.RefObject<HTMLDivElement>,
        setShowLeft: (show: boolean) => void,
        setShowRight: (show: boolean) => void
    ) => {
        if (ref.current) {
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            setShowLeft(scrollLeft > 10);
            setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    }, []);

    // Check scroll positions on mount and when content changes
    useEffect(() => {
        const checkAll = () => {
            checkScrollPosition(tabsRef, setShowTabsLeft, setShowTabsRight);
            checkScrollPosition(statusRef, setShowStatusLeft, setShowStatusRight);
            checkScrollPosition(chipsRef, setShowChipsLeft, setShowChipsRight);
            checkScrollPosition(streamsRef, setShowStreamsLeft, setShowStreamsRight);
            checkScrollPosition(cdnRef, setShowCdnLeft, setShowCdnRight);
        };

        checkAll();
        window.addEventListener('resize', checkAll);
        return () => window.removeEventListener('resize', checkAll);
    }, [checkScrollPosition, games.length, streams.length, selectedGame]);

    const fetchMatches = useCallback(async () => {
        try {
            setError(null);

            const [allRes, liveRes, cdnRes] = await Promise.allSettled([
                fetchJson('/api/matches/all'),
                fetchJson('/api/matches/live'),
                fetchCdn(),
            ]);

            const streamedOk = allRes.status === 'fulfilled' || liveRes.status === 'fulfilled';
            const cdnOk = cdnRes.status === 'fulfilled';

            if (!streamedOk && !cdnOk) {
                throw new Error('Both servers are unreachable right now');
            }

            const all: ApiMatch[] =
                allRes.status === 'fulfilled' && Array.isArray(allRes.value) ? allRes.value : [];
            const live: ApiMatch[] =
                liveRes.status === 'fulfilled' && Array.isArray(liveRes.value) ? liveRes.value : [];
            const liveKnown = liveRes.status === 'fulfilled';

            const byId = new Map<string, ApiMatch>();
            [...all, ...live].forEach(m => {
                if (m && m.id && !byId.has(String(m.id))) byId.set(String(m.id), m);
            });

            const liveIds = new Set(live.map(m => String(m.id)));
            const now = Date.now();
            const streamedGames = Array.from(byId.values()).map(m => toGame(m, liveIds, liveKnown, now));

            const cdnEvents = cdnOk ? (cdnRes as PromiseFulfilledResult<CdnEvent[]>).value : [];
            const list = mergeCdn(streamedGames, cdnEvents);

            console.log(
                `Streamed: ${streamedOk ? 'ok' : 'FAILED'} (${streamedGames.length} games) · ` +
                `CDN Live TV: ${cdnOk ? 'ok' : 'FAILED'} (${cdnEvents.length} events)`
            );
            console.log(
                'Games available on BOTH servers:',
                list.filter(g => g.sources.length > 0 && g.cdnChannels.length > 0).map(g => g.title)
            );
            console.log('Leagues detected:', Array.from(new Set(list.map(g => `${g.sport}: ${g.league}`))));

            setProviders({ streamed: streamedOk, cdn: cdnOk });
            setGames(list);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError(err instanceof Error ? err.message : 'Failed to load matches');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(fetchMatches, 60000);
        return () => clearInterval(interval);
    }, [fetchMatches]);

    /* ----- load Streamed streams when a game is opened ----- */

    useEffect(() => {
        if (!selectedGame) return;
        let cancelled = false;

        const load = async () => {
            setStreams([]);
            setStreamIndex(0);

            if (selectedGame.sources.length === 0) {
                setStreamsLoading(false);
                return;
            }

            setStreamsLoading(true);

            const results = await Promise.allSettled(
                selectedGame.sources.map(s => fetchJson(`/api/stream/${s.source}/${s.id}`))
            );

            if (cancelled) return;

            const all: Stream[] = results.flatMap(r =>
                r.status === 'fulfilled' && Array.isArray(r.value) ? (r.value as Stream[]) : []
            );
            const valid = all.filter(s => s && s.embedUrl);
            valid.sort((a, b) => Number(b.hd) - Number(a.hd) || a.streamNo - b.streamNo);

            setStreams(valid);
            setStreamsLoading(false);

            // Nothing from Server 1? Fall back to Server 2 automatically
            if (valid.length === 0 && selectedGame.cdnChannels.length > 0) {
                setServerGroup('cdn');
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [selectedGame]);

    /* ----- derived data ----- */

    const now = useMemo(() => new Date(), [games]);
    const q = normalizeText(search.trim());
    const isSearching = q.length > 0;

    useEffect(() => {
        if (games.length === 0) return;
        const sportKeys = sortSports(Array.from(new Set(games.map(g => g.sport))));

        if (!initialised.current) {
            initialised.current = true;
            const n = new Date();
            const pick: StatusFilter =
                (['today', 'upcoming'] as StatusFilter[]).find(f => games.some(g => matchesStatus(g, f, n))) ?? 'all';
            const firstSport =
                sportKeys.find(s => games.some(g => g.sport === s && matchesStatus(g, pick, n))) ?? sportKeys[0];
            setStatusFilter(pick);
            setActiveTab(firstSport);
            return;
        }

        if (!sportKeys.includes(activeTab)) setActiveTab(sportKeys[0]);
    }, [games, activeTab]);

    const tabs = useMemo(() => {
        const keys = sortSports(Array.from(new Set(games.map(g => g.sport))));
        return keys.map(key => ({
            key,
            label: `${SPORT_EMOJIS[key] ?? '🏆'} ${prettySport(key)}`,
            count: games.filter(g => g.sport === key && matchesStatus(g, statusFilter, now)).length,
        }));
    }, [games, statusFilter, now]);

    const sportGames = useMemo(() => games.filter(g => g.sport === activeTab), [games, activeTab]);

    const statusCounts = useMemo(() => {
        const counts = {} as Record<StatusFilter, number>;
        STATUS_FILTERS.forEach(f => {
            counts[f.key] = sportGames.filter(g => matchesStatus(g, f.key, now)).length;
        });
        return counts;
    }, [sportGames, now]);

    const visibleGames = useMemo(
        () =>
            isSearching
                ? games.filter(g => matchesSearch(g, q))
                : sportGames.filter(g => matchesStatus(g, statusFilter, now)),
        [isSearching, games, sportGames, q, statusFilter, now]
    );

    const groups = useMemo<LeagueGroup[]>(() => {
        const map = new Map<string, LeagueGroup>();

        visibleGames.forEach(g => {
            const key = `${g.sport}|${g.league}`;
            let group = map.get(key);
            if (!group) {
                const leaguePriority = getLeaguePriority(g.league);
                const basePriority =
                    g.sport === 'football' || leaguePriority < 100
                        ? leaguePriority
                        : SPORT_GROUP_PRIORITY[g.sport] ?? 100;
                group = {
                    id: `league-${slugify(key)}`,
                    name: g.league,
                    sport: g.sport,
                    priority: basePriority,
                    games: [],
                };
                map.set(key, group);
            }
            group.games.push(g);
        });

        const list = Array.from(map.values());
        list.forEach(group => group.games.sort(sortGames));
        list.sort(
            (a, b) =>
                a.priority - b.priority ||
                liveCount(b) - liveCount(a) ||
                a.name.localeCompare(b.name)
        );
        return list;
    }, [visibleGames]);

    const topGroups = groups.filter(g => g.priority < TOP_THRESHOLD);
    const otherGroups = groups.filter(g => g.priority >= TOP_THRESHOLD);

    /* ----- actions ----- */

    const openGame = (game: Game) => {
        if (serverCount(game) === 0) return;
        setServerGroup(game.sources.length > 0 ? 'streamed' : 'cdn');
        setStreamIndex(0);
        setCdnIndex(0);
        setSelectedGame(game);
    };

    const toggleGroup = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

    const jumpTo = (id: string) => {
        setCollapsed(prev => ({ ...prev, [id]: false }));
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ----- player view ----- */

    if (selectedGame) {
        const hasStreamed = selectedGame.sources.length > 0;
        const hasCdn = selectedGame.cdnChannels.length > 0;

        const currentStream = streams[streamIndex] ?? streams[0];
        const currentCdn = selectedGame.cdnChannels[cdnIndex] ?? selectedGame.cdnChannels[0];

        const currentUrl = serverGroup === 'streamed' ? currentStream?.embedUrl : currentCdn?.url;
        const waiting = serverGroup === 'streamed' && streamsLoading;

        const serverBtn = (active: boolean, enabled: boolean) =>
            `px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap backdrop-blur-sm border transition-all ${active
                ? 'bg-red-600 text-white border-red-500'
                : enabled
                    ? 'bg-black/70 text-gray-300 hover:text-white border-gray-700/50'
                    : 'bg-black/50 text-gray-600 border-gray-800 cursor-not-allowed'
            }`;

        const subBtn = (active: boolean) =>
            `px-3 py-1.5 rounded-lg text-xs whitespace-nowrap backdrop-blur-sm border transition-all ${active
                ? 'bg-zinc-700 text-white border-zinc-500'
                : 'bg-black/70 text-gray-300 hover:text-white border-gray-700/50'
            }`;

        return (
            <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
                <Navbar />

                <button
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-20 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-gray-700/50 hover:border-gray-600"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-medium hidden md:inline">Back to Events</span>
                </button>

                <div className="absolute top-20 right-4 z-50 flex flex-col items-end gap-2 max-w-[65%]">
                    {/* Server switch */}
                    <div className="flex gap-2">
                        <button
                            disabled={!hasStreamed}
                            onClick={() => hasStreamed && setServerGroup('streamed')}
                            className={serverBtn(serverGroup === 'streamed', hasStreamed)}
                        >
                            Server 1
                        </button>
                        <button
                            disabled={!hasCdn}
                            onClick={() => hasCdn && setServerGroup('cdn')}
                            className={serverBtn(serverGroup === 'cdn', hasCdn)}
                        >
                            Server 2
                        </button>
                    </div>

                    {/* Individual streams within the chosen server */}
                    {serverGroup === 'streamed' && streams.length > 1 && (
                        <div className="relative group/streams max-w-full">
                            {showStreamsLeft && (
                                <button
                                    onClick={() => handleScroll(streamsRef, 'left')}
                                    className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-black via-black/90 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/streams:opacity-100 transition-opacity duration-300"
                                >
                                    <div className="bg-black/80 rounded-full p-0.5 hover:bg-black hover:scale-110 transition-all">
                                        <ChevronLeftIcon className="w-3 h-3 text-white" />
                                    </div>
                                </button>
                            )}

                            <div
                                ref={streamsRef}
                                onScroll={() => checkScrollPosition(streamsRef, setShowStreamsLeft, setShowStreamsRight)}
                                className="flex gap-2 overflow-x-auto max-w-full scrollbar-hide scroll-smooth"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {streams.map((stream, index) => (
                                    <button
                                        key={`${stream.source}-${stream.id}-${index}`}
                                        onClick={() => setStreamIndex(index)}
                                        className={subBtn(index === streamIndex)}
                                    >
                                        {stream.source} #{stream.streamNo} · {stream.language}
                                        {stream.hd ? ' · HD' : ''}
                                    </button>
                                ))}
                            </div>

                            {showStreamsRight && (
                                <button
                                    onClick={() => handleScroll(streamsRef, 'right')}
                                    className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-black via-black/90 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/streams:opacity-100 transition-opacity duration-300"
                                >
                                    <div className="bg-black/80 rounded-full p-0.5 hover:bg-black hover:scale-110 transition-all">
                                        <ChevronRightIcon className="w-3 h-3 text-white" />
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    {serverGroup === 'cdn' && selectedGame.cdnChannels.length > 1 && (
                        <div className="relative group/cdn max-w-full">
                            {showCdnLeft && (
                                <button
                                    onClick={() => handleScroll(cdnRef, 'left')}
                                    className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-black via-black/90 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/cdn:opacity-100 transition-opacity duration-300"
                                >
                                    <div className="bg-black/80 rounded-full p-0.5 hover:bg-black hover:scale-110 transition-all">
                                        <ChevronLeftIcon className="w-3 h-3 text-white" />
                                    </div>
                                </button>
                            )}

                            <div
                                ref={cdnRef}
                                onScroll={() => checkScrollPosition(cdnRef, setShowCdnLeft, setShowCdnRight)}
                                className="flex gap-2 overflow-x-auto max-w-full scrollbar-hide scroll-smooth"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {selectedGame.cdnChannels.map((channel, index) => (
                                    <button
                                        key={`${channel.channel_name}-${index}`}
                                        onClick={() => setCdnIndex(index)}
                                        className={subBtn(index === cdnIndex)}
                                    >
                                        {channel.channel_name} ({(channel.channel_code ?? '').toUpperCase()})
                                    </button>
                                ))}
                            </div>

                            {showCdnRight && (
                                <button
                                    onClick={() => handleScroll(cdnRef, 'right')}
                                    className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-black via-black/90 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/cdn:opacity-100 transition-opacity duration-300"
                                >
                                    <div className="bg-black/80 rounded-full p-0.5 hover:bg-black hover:scale-110 transition-all">
                                        <ChevronRightIcon className="w-3 h-3 text-white" />
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    {hasStreamed && hasCdn && (
                        <p className="text-[11px] text-gray-400 bg-black/60 rounded px-2 py-1">
                            Slow or not loading? Switch server.
                        </p>
                    )}
                </div>

                <div className="flex-1 w-full pt-16">
                    {waiting ? (
                        <div className="h-full flex items-center justify-center text-white">Loading streams...</div>
                    ) : currentUrl ? (
                        <iframe
                            key={currentUrl}
                            src={currentUrl}
                            className="w-full h-full"
                            allowFullScreen
                            allow="encrypted-media; autoplay; fullscreen"
                            referrerPolicy={serverGroup === 'streamed' ? 'origin' : undefined}
                            title={selectedGame.title}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4">
                            <p className="text-gray-300 text-lg">
                                No streams available on this server yet.
                            </p>
                            <p className="text-gray-500 text-sm max-w-md">
                                {hasCdn && serverGroup === 'streamed'
                                    ? 'Try Server 2 using the buttons at the top right.'
                                    : 'Streams usually appear shortly before kickoff. Try again closer to the start time.'}
                            </p>
                            <button
                                onClick={() => setSelectedGame(null)}
                                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                            >
                                Back to events
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ----- list view pieces ----- */

    const renderTeam = (team?: TeamInfo) =>
        team?.name ? (
            <div className="flex items-center gap-3 mb-2">
                {team.img ? (
                    <img
                        src={team.img}
                        alt={team.name}
                        onError={hideBrokenImage}
                        loading="lazy"
                        className="w-8 h-8 object-contain"
                    />
                ) : (
                    <div className="w-8 h-8" />
                )}
                <span className="text-white font-semibold truncate">{team.name}</span>
            </div>
        ) : null;

    const renderGame = (game: Game, index: number) => {
        const servers = serverCount(game);
        const hasStream = servers > 0;
        const isLive = game.status === 'live';
        const { day, time } = formatKickoff(game, now);
        const hasTeams = !!(game.home?.name && game.away?.name);

        return (
            <div
                key={`${game.id}-${index}`}
                onClick={() => openGame(game)}
                className={`rounded-lg p-4 transition border bg-zinc-800 ${isLive ? 'border-red-600/60' : 'border-transparent'
                    } ${hasStream ? 'hover:bg-zinc-700 cursor-pointer' : 'opacity-60'} ${game.status === 'finished' ? 'opacity-80' : ''
                    }`}
            >
                <div className="flex items-center justify-between mb-3">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${isLive ? 'bg-red-600' : game.status === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'
                            }`}
                    >
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {game.status.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm">
                        {day} · {time}
                    </span>
                </div>

                {hasTeams ? (
                    <div className="mb-3">
                        {renderTeam(game.home)}
                        {renderTeam(game.away)}
                    </div>
                ) : (
                    <div className="text-white font-semibold mb-3">{game.title}</div>
                )}

                <div className="border-t border-gray-700 pt-3 text-sm flex items-center justify-between">
                    {hasStream ? (
                        <span className="text-green-400">
                            📺 {servers} server{servers > 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="text-gray-500">No stream available</span>
                    )}
                    {game.popular && <span className="text-yellow-500 text-xs font-semibold">⭐ Popular</span>}
                </div>
            </div>
        );
    };

    const renderGroup = (group: LeagueGroup) => {
        const isCollapsed = !!collapsed[group.id];
        const live = liveCount(group);

        return (
            <section key={group.id} id={group.id} className="mb-8 scroll-mt-24">
                <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-3 transition"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-white font-bold text-lg truncate">{group.name}</h2>
                        {isSearching && (
                            <span className="text-xs text-gray-400 bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 shrink-0">
                                {SPORT_EMOJIS[group.sport] ?? '🏆'} {prettySport(group.sport)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {live > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                {live} LIVE
                            </span>
                        )}
                        <span className="text-gray-400 text-sm">
                            {group.games.length} game{group.games.length > 1 ? 's' : ''}
                        </span>
                        <ChevronDownIcon
                            className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                        />
                    </div>
                </button>

                {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {group.games.map(renderGame)}
                    </div>
                )}
            </section>
        );
    };

    /* ----- list view ----- */

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <div className="pt-24 pb-12 px-4 md:px-16">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Live Sports</h1>
                <p className="text-gray-400 mb-1">Watch live sporting events from around the world</p>
                {lastUpdated && (
                    <p className="text-gray-600 text-xs mb-2">
                        {games.length} games loaded · updated{' '}
                        {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
                {(!providers.streamed || !providers.cdn) && (
                    <p className="text-yellow-500 text-xs mb-6">
                        ⚠️ {!providers.streamed ? 'Server 1 (Streamed)' : 'Server 2 (CDN Live)'} is unreachable right now.
                        Showing games from the other server only.
                    </p>
                )}
                {providers.streamed && providers.cdn && <div className="mb-6" />}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-white">Loading sports events...</div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                        <div className="text-red-400 text-lg">⚠️ {error}</div>
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetchMatches();
                            }}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                        <div className="text-gray-400 text-lg">📅 No sports events available right now</div>
                        <p className="text-gray-500 text-sm max-w-md">
                            Check back later when games are live or upcoming.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Search */}
                        <div className="relative w-full md:max-w-xl mb-6">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search any team, league or sport..."
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-600 outline-none text-white rounded-full pl-12 pr-11 py-3"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {isSearching ? (
                            <p className="text-gray-400 text-sm mb-6">
                                {visibleGames.length} result{visibleGames.length === 1 ? '' : 's'} for “{search.trim()}”
                                across all sports and statuses
                            </p>
                        ) : (
                            <>
                                {/* Sport tabs */}
                                <div className="relative group/tabs">
                                    {showTabsLeft && (
                                        <button
                                            onClick={() => handleScroll(tabsRef, 'left')}
                                            className="absolute left-0 top-0 bottom-0 z-10 w-8 md:w-12 bg-gradient-to-r from-black via-black/80 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/tabs:opacity-100 transition-opacity duration-300"
                                        >
                                            <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                                                <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                        </button>
                                    )}

                                    <div
                                        ref={tabsRef}
                                        onScroll={() => checkScrollPosition(tabsRef, setShowTabsLeft, setShowTabsRight)}
                                        className="flex gap-4 mb-6 border-b border-gray-800 overflow-x-auto scrollbar-hide scroll-smooth"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`pb-4 px-4 text-lg font-semibold transition whitespace-nowrap ${activeTab === tab.key
                                                    ? 'text-white border-b-2 border-red-600'
                                                    : tab.count === 0
                                                        ? 'text-gray-600 hover:text-gray-400'
                                                        : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {tab.label} ({tab.count})
                                            </button>
                                        ))}
                                    </div>

                                    {showTabsRight && (
                                        <button
                                            onClick={() => handleScroll(tabsRef, 'right')}
                                            className="absolute right-0 top-0 bottom-0 z-10 w-8 md:w-12 bg-gradient-to-l from-black via-black/80 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/tabs:opacity-100 transition-opacity duration-300"
                                        >
                                            <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                                                <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                        </button>
                                    )}
                                </div>

                                {/* Status filter */}
                                <div className="relative group/status">
                                    {showStatusLeft && (
                                        <button
                                            onClick={() => handleScroll(statusRef, 'left')}
                                            className="absolute left-0 top-0 bottom-0 z-10 w-8 md:w-12 bg-gradient-to-r from-black via-black/80 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/status:opacity-100 transition-opacity duration-300"
                                        >
                                            <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                                                <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                        </button>
                                    )}

                                    <div
                                        ref={statusRef}
                                        onScroll={() => checkScrollPosition(statusRef, setShowStatusLeft, setShowStatusRight)}
                                        className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide scroll-smooth"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {STATUS_FILTERS.map(f => (
                                            <button
                                                key={f.key}
                                                onClick={() => setStatusFilter(f.key)}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition border ${statusFilter === f.key
                                                    ? 'bg-red-600 border-red-600 text-white'
                                                    : 'bg-zinc-900 border-zinc-700 text-gray-300 hover:text-white hover:border-zinc-500'
                                                    }`}
                                            >
                                                {f.label} ({statusCounts[f.key] ?? 0})
                                            </button>
                                        ))}
                                    </div>

                                    {showStatusRight && (
                                        <button
                                            onClick={() => handleScroll(statusRef, 'right')}
                                            className="absolute right-0 top-0 bottom-0 z-10 w-8 md:w-12 bg-gradient-to-l from-black via-black/80 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/status:opacity-100 transition-opacity duration-300"
                                        >
                                            <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                                                <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Quick jump chips */}
                        {groups.length > 1 && (
                            <div className="relative group/chips">
                                {showChipsLeft && (
                                    <button
                                        onClick={() => handleScroll(chipsRef, 'left')}
                                        className="absolute left-0 top-0 bottom-0 z-10 w-8 md:w-12 bg-gradient-to-r from-black via-black/80 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/chips:opacity-100 transition-opacity duration-300"
                                    >
                                        <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                                            <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                    </button>
                                )}

                                <div
                                    ref={chipsRef}
                                    onScroll={() => checkScrollPosition(chipsRef, setShowChipsLeft, setShowChipsRight)}
                                    className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide scroll-smooth"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {groups.map(group => (
                                        <button
                                            key={group.id}
                                            onClick={() => jumpTo(group.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-zinc-900 border border-zinc-800 text-gray-300 hover:text-white hover:border-zinc-600 transition"
                                        >
                                            {liveCount(group) > 0 && <span className="text-red-500 mr-1">●</span>}
                                            {group.name} · {group.games.length}
                                        </button>
                                    ))}
                                </div>

                                {showChipsRight && (
                                    <button
                                        onClick={() => handleScroll(chipsRef, 'right')}
                                        className="absolute right-0 top-0 bottom-0 z-10 w-8 md:w-12 bg-gradient-to-l from-black via-black/80 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/chips:opacity-100 transition-opacity duration-300"
                                    >
                                        <div className="bg-black/80 rounded-full p-1 hover:bg-black hover:scale-110 transition-all">
                                            <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Competitions */}
                        {groups.length === 0 ? (
                            <div className="text-center text-gray-400 py-12">
                                {isSearching ? (
                                    <>
                                        <p className="mb-4">No games found for “{search.trim()}”.</p>
                                        <button
                                            onClick={() => setSearch('')}
                                            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                                        >
                                            Clear search
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="mb-4">
                                            No {prettySport(activeTab)} games match this filter right now.
                                        </p>
                                        {statusFilter !== 'all' && (
                                            <button
                                                onClick={() => setStatusFilter('all')}
                                                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                                            >
                                                Show all games
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : isSearching ? (
                            groups.map(renderGroup)
                        ) : (
                            <>
                                {topGroups.length > 0 && (
                                    <>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500 mb-4">
                                            ⭐ Top Competitions
                                        </h3>
                                        {topGroups.map(renderGroup)}
                                    </>
                                )}

                                {otherGroups.length > 0 && (
                                    <>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 mt-10">
                                            {topGroups.length > 0 ? 'More Competitions' : 'Competitions'}
                                        </h3>
                                        {otherGroups.map(renderGroup)}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default LiveSports;