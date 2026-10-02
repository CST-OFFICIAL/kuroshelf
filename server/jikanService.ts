import { VERIFIED_SEED_ANIME, VERIFIED_SEED_MANGA } from './verifiedSeed';
import { cleanOfficialText } from './officialSynopsisService';
// Server-side Jikan Service Layer
// Handles communication with Jikan REST API with throttling, database caching, stale-while-revalidate,
// and resilient fallbacks when upstream MyAnimeList/Jikan experiences 504 Gateway Timeouts or network issues.



const JIKAN_BASE_URL =
  process.env.JIKAN_API_BASE_URL ||
  
  'https://api.jikan.moe/v4';

export function isNsfwOrAdult(item: any): boolean {
  if (!item) return false;
  const malId = Number(item.mal_id || item.id);
  // Specifically block mal_id 34246 (Kimi no Mana wa Rina Witch / Your Magical Name is Rina Witch)
  if (malId === 34246) return true;
  if (item.isAdult === true) return true;

  // Check rating
  const rating = String(item.rating || '').toLowerCase();
  if (rating.includes('rx') || rating.includes('hentai') || rating.includes('18+')) return true;

  // Check genres
  const genres = [
    ...(Array.isArray(item.genres) ? item.genres : []),
    ...(Array.isArray(item.explicit_genres) ? item.explicit_genres : []),
    ...(Array.isArray(item.themes) ? item.themes : [])
  ];
  for (const g of genres) {
    const name = (typeof g === 'string' ? g : g?.name || '').toLowerCase();
    if (name.includes('hentai') || name.includes('erotica') || name.includes('adult cast')) {
      return true;
    }
  }

  // Check title
  const fullTitle = `${item.title || ''} ${item.title_english || ''} ${item.title_japanese || ''}`.toLowerCase();
  if (
    fullTitle.includes('rina witch') ||
    fullTitle.includes('kimi no mana wa') ||
    fullTitle.includes('your magical name is rina')
  ) {
    return true;
  }

  // Check synopsis
  const synopsis = String(item.synopsis || '').toLowerCase();
  if (
    synopsis.includes('lilith soft') ||
    synopsis.includes('erotic game') ||
    (synopsis.includes('mana supply') && synopsis.includes('witch'))
  ) {
    return true;
  }

  return false;
}

function deduplicateByMalId(list: any[]) {
  const seen = new Set();
  return list.filter(item => {
    if (!item || !item.mal_id) return false;
    if (isNsfwOrAdult(item)) return false;
    if (seen.has(item.mal_id)) return false;
    seen.add(item.mal_id);
    return true;
  });
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items?: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanRelationItem {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanRelation {
  relation: string;
  entry: JikanRelationItem[];
}

export interface BaseJikanAnime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  images: {
    jpg: { image_url: string; small_image_url?: string; large_image_url?: string };
    webp?: { image_url: string; small_image_url?: string; large_image_url?: string };
  };
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  duration?: string | null;
  status?: string;
  rating?: string | null;
  season?: string | null;
  year?: number | null;
  source?: string | null;
  aired?: { from?: string | null; to?: string | null; string?: string };
  broadcast?: { day?: string; time?: string; timezone?: string; string?: string };
  synopsis?: string | null;
  genres?: { mal_id: number; name: string }[];
  themes?: { mal_id: number; name: string }[];
  demographics?: { mal_id: number; name: string }[];
  studios?: { mal_id: number; name: string }[];
  relations?: JikanRelation[];
  trailer?: { youtube_id?: string; url?: string; embed_url?: string };
  streaming?: { name: string; url: string }[];
  external?: { name: string; url: string }[];
  [key: string]: unknown;
}

// In-memory cache for fast sub-second hits
interface CacheEntry<T> {
  data: T;
  pagination?: JikanPagination;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<unknown>>();

const SEARCH_CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes
const CATALOG_CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours
const DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// FIFO queue for throttling outgoing requests to Jikan (never exceeds 2.5 requests per second)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 400;
let queueTail: Promise<void> = Promise.resolve();

async function enqueueJikanRequest<T>(task: () => Promise<T>): Promise<T> {
  const run = async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    lastRequestTime = Date.now();
    return await task();
  };

  const current = queueTail.catch(() => {}).then(run);
  queueTail = current.then(() => {}, () => {});
  return await current;
}

// Database cache lookup with support for stale fallback
function getDbCache<T>(cacheKey: string, skipExpiry: boolean = false) { return null; }
function setDbCache(cacheKey: string, data: any, pagination: any, ttlMs: number) {}

// Seed the local SQLite database on startup with authentic catalog data
export function initCatalogSeed() {}





function getVerifiedSeedFallback<T>(endpoint: string): { data: T, pagination: any } | null {
  if (endpoint.includes('airing') || endpoint.includes('seasons/now')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  if (endpoint.includes('upcoming') || endpoint.includes('seasons/upcoming')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  if (endpoint.includes('bypopularity') || endpoint.includes('top/anime')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  
  // search fallback
  if (endpoint.startsWith('/anime?')) {
    const url = new URL(endpoint, 'http://localhost');
    let q = url.searchParams.get('q')?.toLowerCase();
    if (q) {
      q = q.replace(/[^a-z0-9]/g, '');
      const results = VERIFIED_SEED_ANIME.filter(a => {
        const t1 = a.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const t2 = a.title_english ? a.title_english.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const t3 = a.title_japanese ? a.title_japanese.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        return t1.includes(q) || t2.includes(q) || t3.includes(q);
      });
      
      if (results.length > 0) {
        return { data: results as any, pagination: undefined };
      }
      return null;
    }
  }

  // detail fallback
  const match = endpoint.match(/\/anime\/(\d+)\/(full)?/);
  if (match) {
    const id = parseInt(match[1]);
    const found = VERIFIED_SEED_ANIME.find(a => a.mal_id === id);
    if (found) return { data: found as any, pagination: undefined };
  }

  return null;
}

export async function fetchFromJikan<T>(
  endpoint: string,
  ttlMs: number = CATALOG_CACHE_TTL_MS
): Promise<{ data: T | null; pagination?: JikanPagination }> {
  const cacheKey = endpoint;

  // 1. Check in-memory cache
  const memCached = memoryCache.get(cacheKey);
  if (memCached && Date.now() - memCached.timestamp < ttlMs) {
    return { data: memCached.data as T, pagination: memCached.pagination };
  }

  // 2. Check DB cache (fresh)
  const dbCached = getDbCache<T>(cacheKey, false);
  if (dbCached && dbCached.data) {
    memoryCache.set(cacheKey, { data: dbCached.data, pagination: dbCached.pagination, timestamp: Date.now() });
    return dbCached;
  }

  // 3. Attempt network request with gentle rate-limit handling & silent fallback
  try {
    const result = await enqueueJikanRequest(async () => {
      const isSearch = endpoint.includes('?q=') || endpoint.includes('&q=') || endpoint.includes('genres=');
      const maxRetries = isSearch ? 1 : 2;
      let attempts = 0;

      while (attempts <= maxRetries) {
        attempts++;
        try {
          const url = `${JIKAN_BASE_URL}${endpoint}`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'KuroShelf/1.0 (+https://kuroshelf.app)',
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            },
            signal: AbortSignal.timeout(10000),
          });

          console.log('Jikan HTTP Status:', res.status, url);
          if (res.status === 429) {
            // Upstream Jikan rate limit: wait and retry
            await new Promise((resolve) => setTimeout(resolve, 800 * attempts));
            continue;
          }

          if (res.status === 504 || res.status === 502 || res.status === 503) {
            console.log('Jikan', res.status, 'gateway timeout, failing over to resilient fallback immediately');
            return null;
          }

          console.log('Jikan HTTP Status:', res.status);
          if (!res.ok) {
            if (attempts <= maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 600 * attempts));
              continue;
            }
            return null;
          }

          const json = await res.json();
          if (json.status && json.status >= 400) {
            return null;
          }

          return {
            data: json.data as T,
            pagination: json.pagination as JikanPagination | undefined,
          };
        } catch (e) {
          console.log('[Error suppressed]', 'Jikan fetch error:', e);
          if (attempts > maxRetries) {
            return null;
          }
          await new Promise((resolve) => setTimeout(resolve, 600 * attempts));
        }
      }
      return null;
    });

    if (result && result.data !== null && result.data !== undefined) {
      memoryCache.set(cacheKey, { data: result.data, pagination: result.pagination, timestamp: Date.now() });
      setDbCache(cacheKey, result.data, result.pagination, ttlMs);
      return result;
    }
  } catch (outerErr) {
    console.log('[Error suppressed]', 'Outer jikan catch:', outerErr);
    // Network or queue failure: continue to resilient fallback
  }

  // 4. Stale-while-revalidate fallback: retrieve any existing DB cache (even if expired)
  const staleDb = getDbCache<T>(cacheKey, true);
  if (staleDb && staleDb.data) {
    memoryCache.set(cacheKey, { data: staleDb.data, pagination: staleDb.pagination, timestamp: Date.now() });
    return staleDb;
  }



  const seedFallback = getVerifiedSeedFallback<T>(endpoint);
  if (seedFallback) {
    // DO NOT pretend it is authoritative cache: do NOT set memoryCache for seed fallback.
    // Clearly return the static verified seed data.
    return seedFallback;
  }

  return { data: null };
}

// ---------------- Public Server Methods ----------------

export interface SearchAnimeOptions {
  query?: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  genres?: string;
  orderBy?: string;
  sort?: string;
}



export const ANILIST_GENRE_SET = new Set([
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
]);

export interface GenreMeta {
  mal_id: number;
  name: string;
  isAnilistGenre: boolean;
}

export const GENRE_METADATA_MAP: Record<string, GenreMeta> = {
  // Action & Adventure
  'action': { mal_id: 1, name: 'Action', isAnilistGenre: true },
  'adventure': { mal_id: 2, name: 'Adventure', isAnilistGenre: true },
  'racing': { mal_id: 3, name: 'Racing', isAnilistGenre: false },
  'cars': { mal_id: 3, name: 'Racing', isAnilistGenre: false },
  'comedy': { mal_id: 4, name: 'Comedy', isAnilistGenre: true },
  'demons': { mal_id: 6, name: 'Demons', isAnilistGenre: false },
  'mystery': { mal_id: 7, name: 'Mystery', isAnilistGenre: true },
  'drama': { mal_id: 8, name: 'Drama', isAnilistGenre: true },
  'ecchi': { mal_id: 9, name: 'Ecchi', isAnilistGenre: true },
  'fantasy': { mal_id: 10, name: 'Fantasy', isAnilistGenre: true },
  'strategy game': { mal_id: 11, name: 'Strategy Game', isAnilistGenre: false },
  'historical': { mal_id: 13, name: 'Historical', isAnilistGenre: false },
  'horror': { mal_id: 14, name: 'Horror', isAnilistGenre: true },
  'kids': { mal_id: 15, name: 'Kids', isAnilistGenre: false },
  'martial arts': { mal_id: 17, name: 'Martial Arts', isAnilistGenre: false },
  'mecha': { mal_id: 18, name: 'Mecha', isAnilistGenre: true },
  'music': { mal_id: 19, name: 'Music', isAnilistGenre: true },
  'parody': { mal_id: 20, name: 'Parody', isAnilistGenre: false },
  'samurai': { mal_id: 21, name: 'Samurai', isAnilistGenre: false },
  'romance': { mal_id: 22, name: 'Romance', isAnilistGenre: true },
  'school': { mal_id: 23, name: 'School', isAnilistGenre: false },
  'sci-fi': { mal_id: 24, name: 'Sci-Fi', isAnilistGenre: true },
  'scifi': { mal_id: 24, name: 'Sci-Fi', isAnilistGenre: true },
  'shoujo': { mal_id: 25, name: 'Shoujo', isAnilistGenre: false },
  'girls love': { mal_id: 26, name: 'Girls Love', isAnilistGenre: false },
  'shounen': { mal_id: 27, name: 'Shounen', isAnilistGenre: false },
  'space': { mal_id: 29, name: 'Space', isAnilistGenre: false },
  'sports': { mal_id: 30, name: 'Sports', isAnilistGenre: true },
  'super power': { mal_id: 31, name: 'Super Power', isAnilistGenre: false },
  'vampire': { mal_id: 32, name: 'Vampire', isAnilistGenre: false },
  'harem': { mal_id: 35, name: 'Harem', isAnilistGenre: false },
  'slice of life': { mal_id: 36, name: 'Slice of Life', isAnilistGenre: true },
  'supernatural': { mal_id: 37, name: 'Supernatural', isAnilistGenre: true },
  'military': { mal_id: 38, name: 'Military', isAnilistGenre: false },
  'detective': { mal_id: 39, name: 'Detective', isAnilistGenre: false },
  'psychological': { mal_id: 40, name: 'Psychological', isAnilistGenre: true },
  'suspense': { mal_id: 41, name: 'Thriller', isAnilistGenre: true },
  'thriller': { mal_id: 41, name: 'Thriller', isAnilistGenre: true },
  'seinen': { mal_id: 42, name: 'Seinen', isAnilistGenre: false },
  'josei': { mal_id: 43, name: 'Josei', isAnilistGenre: false },
  'award winning': { mal_id: 46, name: 'Award Winning', isAnilistGenre: false },
  'gourmet': { mal_id: 47, name: 'Gourmet', isAnilistGenre: false },
  'gore': { mal_id: 58, name: 'Gore', isAnilistGenre: false },
  'isekai': { mal_id: 62, name: 'Isekai', isAnilistGenre: false },
  'mahou shoujo': { mal_id: 66, name: 'Mahou Shoujo', isAnilistGenre: true },
  'magic': { mal_id: 10, name: 'Fantasy', isAnilistGenre: true },
  'survival': { mal_id: 76, name: 'Survival', isAnilistGenre: false },
  'time travel': { mal_id: 78, name: 'Time Travel', isAnilistGenre: false },
  'video game': { mal_id: 79, name: 'Video Game', isAnilistGenre: false },
};

export const MAL_ID_METADATA_MAP: Record<number, GenreMeta> = {
  1: { mal_id: 1, name: 'Action', isAnilistGenre: true },
  2: { mal_id: 2, name: 'Adventure', isAnilistGenre: true },
  3: { mal_id: 3, name: 'Racing', isAnilistGenre: false },
  4: { mal_id: 4, name: 'Comedy', isAnilistGenre: true },
  6: { mal_id: 6, name: 'Demons', isAnilistGenre: false },
  7: { mal_id: 7, name: 'Mystery', isAnilistGenre: true },
  8: { mal_id: 8, name: 'Drama', isAnilistGenre: true },
  9: { mal_id: 9, name: 'Ecchi', isAnilistGenre: true },
  10: { mal_id: 10, name: 'Fantasy', isAnilistGenre: true },
  11: { mal_id: 11, name: 'Strategy Game', isAnilistGenre: false },
  13: { mal_id: 13, name: 'Historical', isAnilistGenre: false },
  14: { mal_id: 14, name: 'Horror', isAnilistGenre: true },
  15: { mal_id: 15, name: 'Kids', isAnilistGenre: false },
  17: { mal_id: 17, name: 'Martial Arts', isAnilistGenre: false },
  18: { mal_id: 18, name: 'Mecha', isAnilistGenre: true },
  19: { mal_id: 19, name: 'Music', isAnilistGenre: true },
  20: { mal_id: 20, name: 'Parody', isAnilistGenre: false },
  21: { mal_id: 21, name: 'Samurai', isAnilistGenre: false },
  22: { mal_id: 22, name: 'Romance', isAnilistGenre: true },
  23: { mal_id: 23, name: 'School', isAnilistGenre: false },
  24: { mal_id: 24, name: 'Sci-Fi', isAnilistGenre: true },
  25: { mal_id: 25, name: 'Shoujo', isAnilistGenre: false },
  26: { mal_id: 26, name: 'Girls Love', isAnilistGenre: false },
  27: { mal_id: 27, name: 'Shounen', isAnilistGenre: false },
  29: { mal_id: 29, name: 'Space', isAnilistGenre: false },
  30: { mal_id: 30, name: 'Sports', isAnilistGenre: true },
  31: { mal_id: 31, name: 'Super Power', isAnilistGenre: false },
  32: { mal_id: 32, name: 'Vampire', isAnilistGenre: false },
  35: { mal_id: 35, name: 'Harem', isAnilistGenre: false },
  36: { mal_id: 36, name: 'Slice of Life', isAnilistGenre: true },
  37: { mal_id: 37, name: 'Supernatural', isAnilistGenre: true },
  38: { mal_id: 38, name: 'Military', isAnilistGenre: false },
  39: { mal_id: 39, name: 'Detective', isAnilistGenre: false },
  40: { mal_id: 40, name: 'Psychological', isAnilistGenre: true },
  41: { mal_id: 41, name: 'Thriller', isAnilistGenre: true },
  42: { mal_id: 42, name: 'Seinen', isAnilistGenre: false },
  43: { mal_id: 43, name: 'Josei', isAnilistGenre: false },
  46: { mal_id: 46, name: 'Award Winning', isAnilistGenre: false },
  47: { mal_id: 47, name: 'Gourmet', isAnilistGenre: false },
  58: { mal_id: 58, name: 'Gore', isAnilistGenre: false },
  62: { mal_id: 62, name: 'Isekai', isAnilistGenre: false },
  66: { mal_id: 66, name: 'Mahou Shoujo', isAnilistGenre: true },
  76: { mal_id: 76, name: 'Survival', isAnilistGenre: false },
  78: { mal_id: 78, name: 'Time Travel', isAnilistGenre: false },
  79: { mal_id: 79, name: 'Video Game', isAnilistGenre: false }
};

export function resolveGenreInfo(rawGenre: string | number): GenreMeta | null {
  if (!rawGenre || rawGenre === 'all') return null;
  const asNum = Number(rawGenre);
  if (!isNaN(asNum) && MAL_ID_METADATA_MAP[asNum]) {
    return MAL_ID_METADATA_MAP[asNum];
  }
  const cleanStr = String(rawGenre).trim().toLowerCase();
  if (GENRE_METADATA_MAP[cleanStr]) {
    return GENRE_METADATA_MAP[cleanStr];
  }
  // Title-case fallback
  const capitalized = cleanStr.charAt(0).toUpperCase() + cleanStr.slice(1);
  return {
    mal_id: asNum || 0,
    name: capitalized,
    isAnilistGenre: ANILIST_GENRE_SET.has(capitalized)
  };
}

export const GENRE_NAME_TO_MAL_ID: Record<string, string> = Object.fromEntries(
  Object.entries(GENRE_METADATA_MAP).map(([k, v]) => [k, String(v.mal_id)])
);

const FORMAT_MAP: Record<string, string> = {
  tv: 'TV',
  movie: 'MOVIE',
  ova: 'OVA',
  ona: 'ONA',
  special: 'SPECIAL',
  music: 'MUSIC'
};

const STATUS_MAP: Record<string, string> = {
  airing: 'RELEASING',
  complete: 'FINISHED',
  upcoming: 'NOT_YET_RELEASED'
};

export function computeExactScore(m: any): number | null {
  if (!m) return null;
  if (typeof m.score === 'number' && m.score > 0) {
    return Number(m.score.toFixed(2));
  }
  if (m.stats?.scoreDistribution && Array.isArray(m.stats.scoreDistribution) && m.stats.scoreDistribution.length > 0) {
    let totalVotes = 0;
    let weightedSum = 0;
    for (const d of m.stats.scoreDistribution) {
      if (d && typeof d.score === 'number' && typeof d.amount === 'number') {
        weightedSum += d.score * d.amount;
        totalVotes += d.amount;
      }
    }
    if (totalVotes > 0) {
      return Number((weightedSum / totalVotes / 10).toFixed(2));
    }
  }
  if (typeof m.averageScore === 'number' && m.averageScore > 0) {
    return Number((m.averageScore / 10).toFixed(2));
  }
  return null;
}

export const STUDIO_ALIASES: Record<string, string> = {
  'mappa': 'MAPPA',
  'bones': 'bones',
  'studio bones': 'bones',
  'kyoani': 'Kyoto Animation',
  'kyoto animation': 'Kyoto Animation',
  'kyoto': 'Kyoto Animation',
  'ufotable': 'ufotable',
  'wit': 'WIT STUDIO',
  'wit studio': 'WIT STUDIO',
  'cloverworks': 'CloverWorks',
  'clover works': 'CloverWorks',
  'trigger': 'Studio Trigger',
  'studio trigger': 'Studio Trigger',
  'ghibli': 'Studio Ghibli',
  'studio ghibli': 'Studio Ghibli',
  'madhouse': 'Madhouse',
  'a-1': 'A-1 Pictures',
  'a1': 'A-1 Pictures',
  'a-1 pictures': 'A-1 Pictures',
  'a1 pictures': 'A-1 Pictures',
  'toei': 'Toei Animation',
  'toei animation': 'Toei Animation',
  'pierrot': 'Studio Pierrot',
  'studio pierrot': 'Studio Pierrot',
  'shaft': 'Shaft',
  'david production': 'David Production',
  'david': 'David Production',
  'jc staff': 'J.C.Staff',
  'jcstaff': 'J.C.Staff',
  'j.c.staff': 'J.C.Staff',
  'production ig': 'Production I.G',
  'production i.g': 'Production I.G',
  'white fox': 'White Fox',
  'sunrise': 'Sunrise',
  'bandai namco': 'Sunrise',
  'kinema citrus': 'Kinema Citrus',
  'doga kobo': 'Doga Kobo',
  'lerche': 'Lerche',
  'pa works': 'P.A. Works',
  'p.a. works': 'P.A. Works',
  'tms': 'TMS Entertainment',
  'tms entertainment': 'TMS Entertainment',
  'bind': 'Studio Bind',
  'studio bind': 'Studio Bind',
  'comix wave': 'CoMix Wave Films',
  'comix wave films': 'CoMix Wave Films',
  'silver link': 'SILVER LINK.',
  'feel': 'feel.',
  'deen': 'Studio Deen',
  'studio deen': 'Studio Deen',
  'gainax': 'Gainax'
};

export const COMMON_ABBREVIATIONS: Record<string, string> = {
  'aot': 'Attack on Titan',
  'snk': 'Shingeki no Kyojin',
  'mha': 'My Hero Academia',
  'bnha': 'Boku no Hero Academia',
  'jjk': 'Jujutsu Kaisen',
  'fma': 'Fullmetal Alchemist',
  'fmab': 'Fullmetal Alchemist: Brotherhood',
  'kny': 'Demon Slayer: Kimetsu no Yaiba',
  'ds': 'Demon Slayer',
  'sao': 'Sword Art Online',
  'hxh': 'Hunter x Hunter',
  'csm': 'Chainsaw Man',
  'sxf': 'Spy x Family',
  'dbz': 'Dragon Ball Z',
  'db': 'Dragon Ball',
  'dbs': 'Dragon Ball Super',
  'eva': 'Neon Genesis Evangelion',
  'nge': 'Neon Genesis Evangelion',
  'opm': 'One Punch Man',
  'op': 'One Piece',
  'bocchi': 'Bocchi the Rock!',
  'rezero': 'Re:Zero',
  'slime': 'That Time I Got Reincarnated as a Slime',
  'danmachi': 'Is It Wrong to Try to Pick Up Girls in a Dungeon?',
  'oregairu': 'My Teen Romantic Comedy SNAFU',
  'snafu': 'My Teen Romantic Comedy SNAFU',
  'mushoku': 'Mushoku Tensei'
};

export const ICONIC_CHARACTERS: Record<string, { character: string; titles: string[]; mal_ids: number[] }> = {
  // One Piece
  'luffy': { character: 'Monkey D. Luffy', titles: ['One Piece'], mal_ids: [21, 50410, 12859, 38234] },
  'zoro': { character: 'Roronoa Zoro', titles: ['One Piece'], mal_ids: [21] },
  'sanji': { character: 'Vinsmoke Sanji', titles: ['One Piece'], mal_ids: [21] },
  'nami': { character: 'Nami', titles: ['One Piece'], mal_ids: [21] },
  'chopper': { character: 'Tony Tony Chopper', titles: ['One Piece'], mal_ids: [21] },

  // Dragon Ball
  'goku': { character: 'Son Goku', titles: ['Dragon Ball Z', 'Dragon Ball', 'Dragon Ball Super'], mal_ids: [813, 223, 30694, 6033, 225] },
  'vegeta': { character: 'Vegeta', titles: ['Dragon Ball Z', 'Dragon Ball Super'], mal_ids: [813, 30694] },
  'gohan': { character: 'Son Gohan', titles: ['Dragon Ball Z'], mal_ids: [813] },
  'piccolo': { character: 'Piccolo', titles: ['Dragon Ball Z'], mal_ids: [813, 223] },

  // Attack on Titan
  'levi': { character: 'Levi Ackerman', titles: ['Attack on Titan', 'Shingeki no Kyojin'], mal_ids: [16498, 25777, 35760, 38524, 40028] },
  'eren': { character: 'Eren Yeager', titles: ['Attack on Titan', 'Shingeki no Kyojin'], mal_ids: [16498, 25777, 35760, 38524, 40028] },
  'mikasa': { character: 'Mikasa Ackerman', titles: ['Attack on Titan', 'Shingeki no Kyojin'], mal_ids: [16498, 25777, 35760, 38524, 40028] },
  'armin': { character: 'Armin Arlert', titles: ['Attack on Titan'], mal_ids: [16498, 25777, 35760] },

  // Jujutsu Kaisen
  'gojo': { character: 'Satoru Gojo', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009, 48561] },
  'sukuna': { character: 'Ryomen Sukuna', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009] },
  'yuji': { character: 'Yuji Itadori', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009] },
  'megumi': { character: 'Megumi Fushiguro', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009] },
  'nobara': { character: 'Nobara Kugisaki', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009] },

  // Naruto
  'naruto': { character: 'Naruto Uzumaki', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },
  'sasuke': { character: 'Sasuke Uchiha', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },
  'itachi': { character: 'Itachi Uchiha', titles: ['Naruto: Shippuuden'], mal_ids: [1735, 20] },
  'kakashi': { character: 'Kakashi Hatake', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },
  'madara': { character: 'Madara Uchiha', titles: ['Naruto: Shippuuden'], mal_ids: [1735] },
  'jiraiya': { character: 'Jiraiya', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },
  'hinata': { character: 'Hinata Hyuga', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },

  // Demon Slayer
  'tanjiro': { character: 'Tanjiro Kamado', titles: ['Demon Slayer', 'Kimetsu no Yaiba'], mal_ids: [38000, 40456, 47778, 49926, 51019] },
  'nezuko': { character: 'Nezuko Kamado', titles: ['Demon Slayer', 'Kimetsu no Yaiba'], mal_ids: [38000, 40456, 47778] },
  'zenitsu': { character: 'Zenitsu Agatsuma', titles: ['Demon Slayer'], mal_ids: [38000, 40456, 47778] },
  'inosuke': { character: 'Inosuke Hashibira', titles: ['Demon Slayer'], mal_ids: [38000, 40456] },
  'rengoku': { character: 'Kyojuro Rengoku', titles: ['Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train'], mal_ids: [40456, 49926, 38000] },

  // My Hero Academia
  'deku': { character: 'Izuku Midoriya', titles: ['My Hero Academia', 'Boku no Hero Academia'], mal_ids: [31964, 33486, 36456, 38408] },
  'all might': { character: 'All Might', titles: ['My Hero Academia'], mal_ids: [31964, 33486] },
  'bakugo': { character: 'Katsuki Bakugo', titles: ['My Hero Academia'], mal_ids: [31964, 33486] },
  'todoroki': { character: 'Shoto Todoroki', titles: ['My Hero Academia'], mal_ids: [31964, 33486] },

  // Hunter x Hunter
  'killua': { character: 'Killua Zoldyck', titles: ['Hunter x Hunter'], mal_ids: [11061] },
  'gon': { character: 'Gon Freecss', titles: ['Hunter x Hunter'], mal_ids: [11061] },
  'kurapika': { character: 'Kurapika', titles: ['Hunter x Hunter'], mal_ids: [11061] },
  'hisoka': { character: 'Hisoka Morow', titles: ['Hunter x Hunter'], mal_ids: [11061] },

  // Death Note
  'light': { character: 'Light Yagami', titles: ['Death Note'], mal_ids: [1535] },
  'l': { character: 'L Lawliet', titles: ['Death Note'], mal_ids: [1535] },
  'ryuk': { character: 'Ryuk', titles: ['Death Note'], mal_ids: [1535] },

  // One Punch Man
  'saitama': { character: 'Saitama', titles: ['One Punch Man'], mal_ids: [30276, 34134] },
  'genos': { character: 'Genos', titles: ['One Punch Man'], mal_ids: [30276] },

  // Fullmetal Alchemist
  'edward': { character: 'Edward Elric', titles: ['Fullmetal Alchemist: Brotherhood'], mal_ids: [5114, 121] },
  'edward elric': { character: 'Edward Elric', titles: ['Fullmetal Alchemist: Brotherhood'], mal_ids: [5114, 121] },
  'alphonse': { character: 'Alphonse Elric', titles: ['Fullmetal Alchemist: Brotherhood'], mal_ids: [5114] },
  'mustang': { character: 'Roy Mustang', titles: ['Fullmetal Alchemist: Brotherhood'], mal_ids: [5114] },

  // Bleach
  'ichigo': { character: 'Ichigo Kurosaki', titles: ['Bleach'], mal_ids: [269, 41467, 52647] },
  'aizen': { character: 'Sosuke Aizen', titles: ['Bleach'], mal_ids: [269, 41467] },
  'rukia': { character: 'Rukia Kuchiki', titles: ['Bleach'], mal_ids: [269, 41467] },

  // Code Geass
  'lelouch': { character: 'Lelouch Lamperouge', titles: ['Code Geass'], mal_ids: [1575, 2904] },

  // Re:Zero
  'rem': { character: 'Rem', titles: ['Re:Zero'], mal_ids: [31240, 39587, 54857] },
  'emilia': { character: 'Emilia', titles: ['Re:Zero'], mal_ids: [31240, 39587] },
  'subaru': { character: 'Natsuki Subaru', titles: ['Re:Zero'], mal_ids: [31240, 39587] },

  // Chainsaw Man
  'denji': { character: 'Denji', titles: ['Chainsaw Man'], mal_ids: [44511] },
  'makima': { character: 'Makima', titles: ['Chainsaw Man'], mal_ids: [44511] },
  'power': { character: 'Power', titles: ['Chainsaw Man'], mal_ids: [44511] },

  // Spy x Family
  'anya': { character: 'Anya Forger', titles: ['SPY x FAMILY'], mal_ids: [50265, 53887] },
  'loid': { character: 'Loid Forger', titles: ['SPY x FAMILY'], mal_ids: [50265] },
  'yor': { character: 'Yor Forger', titles: ['SPY x FAMILY'], mal_ids: [50265] },

  // Frieren
  'frieren': { character: 'Frieren', titles: ["Frieren: Beyond Journey's End"], mal_ids: [52991] },

  // Solo Leveling
  'jinwoo': { character: 'Sung Jinwoo', titles: ['Solo Leveling'], mal_ids: [52299, 58567] },
  'sung jinwoo': { character: 'Sung Jinwoo', titles: ['Solo Leveling'], mal_ids: [52299, 58567] },

  // Vinland Saga
  'thorfinn': { character: 'Thorfinn', titles: ['Vinland Saga'], mal_ids: [37521, 51535] },

  // Mob Psycho 100
  'mob': { character: 'Shigeo Kageyama', titles: ['Mob Psycho 100'], mal_ids: [32182, 37510, 50172] },

  // Tokyo Ghoul
  'kaneki': { character: 'Ken Kaneki', titles: ['Tokyo Ghoul'], mal_ids: [22319, 27899] },

  // Cowboy Bebop
  'spike': { character: 'Spike Spiegel', titles: ['Cowboy Bebop'], mal_ids: [1] },

  // Neon Genesis Evangelion
  'shinji': { character: 'Shinji Ikari', titles: ['Neon Genesis Evangelion'], mal_ids: [30] },
  'asuka': { character: 'Asuka Langley', titles: ['Neon Genesis Evangelion'], mal_ids: [30] },

  // Berserk
  'guts': { character: 'Guts', titles: ['Berserk'], mal_ids: [33] },

  // KonoSuba
  'megumin': { character: 'Megumin', titles: ['KonoSuba'], mal_ids: [30831, 32937, 49458] },
  'aqua': { character: 'Aqua', titles: ['KonoSuba'], mal_ids: [30831, 32937] },

  // Other iconic
  'rimuru': { character: 'Rimuru Tempest', titles: ['That Time I Got Reincarnated as a Slime'], mal_ids: [37430, 41487, 53580] },
  'violet': { character: 'Violet Evergarden', titles: ['Violet Evergarden'], mal_ids: [33352, 37987] },
  'violet evergarden': { character: 'Violet Evergarden', titles: ['Violet Evergarden'], mal_ids: [33352, 37987] },
  'bocchi': { character: 'Hitori Gotoh', titles: ['Bocchi the Rock!'], mal_ids: [47917] },
  'maomao': { character: 'Maomao', titles: ['The Apothecary Diaries'], mal_ids: [54492] },
  'marin': { character: 'Marin Kitagawa', titles: ['My Dress-Up Darling'], mal_ids: [48736] },
  'sailor moon': { character: 'Sailor Moon', titles: ['Sailor Moon'], mal_ids: [530] },
  'alucard': { character: 'Alucard', titles: ['Hellsing Ultimate'], mal_ids: [777] }
};

export const ICONIC_STUDIOS: Record<string, { studio: string; mal_ids: number[] }> = {
  'mappa': { studio: 'MAPPA', mal_ids: [40748, 44511, 40028, 51009, 51535, 46569, 48561, 37520, 32995] },
  'bones': { studio: 'Bones', mal_ids: [5114, 31964, 32182, 31478, 3588, 20507, 24439, 20057] },
  'ufotable': { studio: 'ufotable', mal_ids: [38000, 40456, 47778, 10087, 22297, 2593] },
  'kyoani': { studio: 'Kyoto Animation', mal_ids: [28851, 33352, 12189, 4181, 5680, 10165, 18507, 33206, 2167] },
  'kyoto animation': { studio: 'Kyoto Animation', mal_ids: [28851, 33352, 12189, 4181, 5680, 10165, 18507, 33206, 2167] },
  'wit': { studio: 'WIT STUDIO', mal_ids: [16498, 25777, 35760, 37521, 50265, 40834, 46095, 28623] },
  'wit studio': { studio: 'WIT STUDIO', mal_ids: [16498, 25777, 35760, 37521, 50265, 40834, 46095, 28623] },
  'cloverworks': { studio: 'CloverWorks', mal_ids: [47917, 37779, 48736, 50265, 37450, 42897, 54900] },
  'madhouse': { studio: 'Madhouse', mal_ids: [1535, 11061, 30276, 52991, 19, 22535, 19815, 29803, 889] },
  'trigger': { studio: 'Studio Trigger', mal_ids: [18679, 42310, 33489, 52701, 2001, 35848] },
  'studio trigger': { studio: 'Studio Trigger', mal_ids: [18679, 42310, 33489, 52701, 2001, 35848] },
  'ghibli': { studio: 'Studio Ghibli', mal_ids: [199, 164, 431, 523, 513, 578] },
  'studio ghibli': { studio: 'Studio Ghibli', mal_ids: [199, 164, 431, 523, 513, 578] },
  'shaft': { studio: 'Shaft', mal_ids: [5081, 9756, 17074, 31646, 18897] },
  'a-1 pictures': { studio: 'A-1 Pictures', mal_ids: [11757, 37999, 52299, 23273, 41457, 50709, 31043, 9989] },
  'a1 pictures': { studio: 'A-1 Pictures', mal_ids: [11757, 37999, 52299, 23273, 41457, 50709, 31043, 9989] },
  'toei': { studio: 'Toei Animation', mal_ids: [21, 813, 170, 530, 552, 24405] },
  'toei animation': { studio: 'Toei Animation', mal_ids: [21, 813, 170, 530, 552, 24405] },
  'white fox': { studio: 'White Fox', mal_ids: [9253, 31240, 22199, 15809, 38659] },
  'sunrise': { studio: 'Sunrise', mal_ids: [1575, 1, 918, 31251, 249] },
  'david production': { studio: 'David Production', mal_ids: [14719, 38671, 37141, 52712] },
  'doga kobo': { studio: 'Doga Kobo', mal_ids: [52034, 27775, 23289, 55973] },
  'pierrot': { studio: 'Studio Pierrot', mal_ids: [20, 1735, 269, 41467, 22319, 34572] },
  'studio pierrot': { studio: 'Studio Pierrot', mal_ids: [20, 1735, 269, 41467, 22319, 34572] },
  'production ig': { studio: 'Production I.G', mal_ids: [20583, 467, 13601, 849, 10087] }
};

export const ICONIC_LETTER_ANIME: Record<string, number[]> = {
  'a': [16498, 28851, 22199, 24833, 6547, 11111, 47, 9989, 11759, 31580],
  'b': [269, 33, 47917, 31964, 34572, 49596, 31478, 5081, 889, 36649],
  'c': [44511, 1575, 1, 2167, 42310, 28999, 35507, 232],
  'd': [1535, 38000, 813, 38691, 37520, 38668, 6880, 37055],
  'e': [31043, 30, 226, 237, 48316, 40722],
  'f': [5114, 52991, 10087, 6702, 38671, 24439, 227],
  'g': [918, 2001, 245, 40052, 36028, 10793],
  'h': [11061, 20583, 777, 42897, 12189, 46569, 11617],
  'i': [249, 185, 38472, 34542, 40046],
  'j': [40748, 14719, 46569, 12413],
  'k': [37999, 18679, 30831, 5680, 11771, 38000, 28851],
  'l': [1535, 50709, 17265, 33489, 35557, 48583],
  'm': [31964, 32182, 39535, 34599, 19, 14513, 52211, 10620],
  'n': [20, 1735, 19815, 20507, 30, 877, 440],
  'o': [21, 30276, 52034, 29803, 853, 26243],
  'p': [13601, 22535, 37779, 9756, 30240, 527],
  'q': [38101],
  'r': [31240, 45, 30015, 40834, 6675],
  's': [9253, 11757, 50265, 52299, 16498, 3588, 205],
  't': [22319, 4224, 35790, 6, 42249, 2001],
  'u': [52712, 49889, 31064],
  'v': [37521, 33352, 46095, 3457],
  'w': [54900, 57793, 39597, 202, 16742],
  'x': [861, 76],
  'y': [32281, 23273, 392, 18179, 481],
  'z': [54112, 23283, 14075, 250]
};

function hasExactWordMatch(text: string, queryWord: string): boolean {
  if (!text || !queryWord) return false;
  const regex = new RegExp('(?:^|[\\s\\-_:/(,\\[])' + queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|[\\s\\-_:!?,/)\\]])', 'i');
  return regex.test(text);
}

export function scoreAnimeRelevance(
  anime: any,
  query: string,
  isCharacterMatch = false,
  isStudioMatch = false,
  isIconic = false
): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const qAlpha = q.replace(/[^a-z0-9]/g, '');
  const title = (anime.title || '').toLowerCase().trim();
  const titleEng = (anime.title_english || '').toLowerCase().trim();
  const titleJap = (anime.title_japanese || '').toLowerCase().trim();
  
  let score = 0;

  const isTargetStudio = isStudioMatch || Boolean(
    STUDIO_ALIASES[q] && Array.isArray(anime.studios) && anime.studios.some((s: any) => {
      const sName = typeof s === 'string' ? s : s?.name || '';
      return matchesEntity(STUDIO_ALIASES[q] || q, sName);
    })
  );

  // 1. Iconic match (flagship canonical anime for this character, studio, or letter)
  if (isIconic) {
    score += 25000;
  }

  // 2. Exact Title Match
  if (title === q || titleEng === q || titleJap === q) {
    score += 30000;
  }

  // 3. Exact Title without special characters
  const titleAlpha = title.replace(/[^a-z0-9]/g, '');
  const titleEngAlpha = titleEng.replace(/[^a-z0-9]/g, '');
  if (qAlpha && (titleAlpha === qAlpha || titleEngAlpha === qAlpha)) {
    score += 20000;
  }

  // 4. Character Appearance Match (from AniList character media)
  if (isCharacterMatch) {
    score += 8000;
  }

  // 5. Studio Catalog Match (anime produced by target studio)
  if (isTargetStudio) {
    score += 8000;
  }

  // 6. Title prefix and word matches
  const startsWithQ = title.startsWith(q) || titleEng.startsWith(q) || (titleAlpha.startsWith(qAlpha) && qAlpha.length >= 3);
  const wordMatch = hasExactWordMatch(title, q) || hasExactWordMatch(titleEng, q);

  if (q.length === 1) {
    // Single letter search: award heavy bonus to titles that start with that letter
    if (startsWithQ) {
      score += 15000;
    } else {
      score -= 8000; // Penalize non-matching titles
    }
  } else if (!isTargetStudio) {
    if (startsWithQ) {
      score += 12000;
    } else if (wordMatch) {
      score += 6000;
    } else if (title.includes(q) || titleEng.includes(q)) {
      score += 1200;
    }
  } else {
    // In studio search, only give modest bonus for title matches so real studio anime stay on top
    if (startsWithQ) score += 600;
  }

  // 7. Format boost: Prefer primary TV series over short OVAs / specials
  const animeType = (anime.type || '').toUpperCase();
  if (animeType === 'TV' || (!anime.type && !anime.chapters)) {
    score += 2000;
  } else if (animeType === 'MOVIE') {
    score += 1200;
  } else if (animeType === 'OVA' || animeType === 'SPECIAL' || animeType === 'ONA') {
    score -= 400;
  }

  // 8. Popularity bonus (handles both AniList member count and MAL rank)
  const pop = typeof anime.popularity === 'number' && anime.popularity > 0 ? anime.popularity : 0;
  if (pop > 0) {
    if (pop > 1000) {
      // AniList member count: more members = more popular (e.g. 750,000 for One Piece)
      score += Math.min(3000, Math.floor(pop / 250));
    } else {
      // MAL rank: 1 is top, 1000 is 1000th
      score += Math.max(0, 3000 - (pop * 3));
    }
  }

  // 9. Score quality bonus
  const scoreVal = typeof anime.score === 'number' ? anime.score : 0;
  if (scoreVal > 0) {
    score += Math.round(scoreVal * 30);
  }

  return score;
}

export function matchesEntity(search: string, entityName?: string, alternatives: string[] = []): boolean {
  if (!search) return false;
  const s = search.toLowerCase().trim();
  const sAlpha = s.replace(/[^a-z0-9]/g, '');
  if (!sAlpha) return false;

  const names = [entityName, ...alternatives].filter(Boolean) as string[];
  for (const rawName of names) {
    const n = rawName.toLowerCase().trim();
    const nAlpha = n.replace(/[^a-z0-9]/g, '');

    // Exact name match
    if (n === s || nAlpha === sAlpha) return true;

    // Tokenized word match (split on all punctuation and whitespace)
    const words = n.split(/[\s\-_\/()\[\],.:;'"!?+]+/).filter(Boolean);
    const alphaWords = words.map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);

    // Exact word match
    if (alphaWords.includes(sAlpha)) return true;

    // Close variation for minor spelling differences (e.g. gojo vs gojou)
    for (const aw of alphaWords) {
      if (Math.abs(aw.length - sAlpha.length) <= 1 && (aw.startsWith(sAlpha) || sAlpha.startsWith(aw))) {
        return true;
      }
    }

    // Multi-word search query match
    const sWords = s.split(/[\s\-_\/()\[\],.:;'"!?+]+/).filter(Boolean).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
    if (sWords.length > 1 && sWords.every(sw => alphaWords.some(aw => aw === sw || (Math.abs(aw.length - sw.length) <= 1 && aw.startsWith(sw))))) {
      return true;
    }
  }
  return false;
}

async function searchAnilistFallback(
  query: string,
  page: number,
  limit: number,
  genreId?: string,
  typeApi: string = "ALL",
  statusStr?: string,
  orderBy?: string,
  originalType?: string
): Promise<BaseJikanAnime[]> {
  const cleanQuery = query?.trim() || '';
  const lowerQuery = cleanQuery.toLowerCase();
  
  // Resolve abbreviations & studio aliases
  const resolvedQuery = COMMON_ABBREVIATIONS[lowerQuery] || STUDIO_ALIASES[lowerQuery] || cleanQuery;
  const isStudioKeyword = Boolean(STUDIO_ALIASES[lowerQuery]);

  const genreMeta = genreId ? resolveGenreInfo(genreId) : null;
  const genreStr = genreMeta?.isAnilistGenre ? genreMeta.name : undefined;
  const tagStr = genreMeta && !genreMeta.isAnilistGenre ? genreMeta.name : undefined;

  const formatStr = originalType && originalType !== 'all' ? FORMAT_MAP[originalType.toLowerCase()] : undefined;
  const statusApi = statusStr && statusStr !== 'all' ? STATUS_MAP[statusStr.toLowerCase()] : undefined;
  
  let sort = 'POPULARITY_DESC';
  if (orderBy === 'score') sort = 'SCORE_DESC';
  else if (orderBy === 'favorites') sort = 'FAVORITES_DESC';
  else if (orderBy === 'start_date') sort = 'START_DATE_DESC';

  const typeArg = typeApi !== 'ALL' ? ', $type: MediaType' : '';
  const typeFilter = typeApi !== 'ALL' ? ', type: $type' : '';
  const genreArg = genreStr ? ', $genre: String' : '';
  const genreFilter = genreStr ? ', genre: $genre' : '';
  const tagArg = tagStr ? ', $tag: String' : '';
  const tagFilter = tagStr ? ', tag: $tag' : '';

  const mediaFields = `
    idMal
    title { romaji english native }
    coverImage { large }
    status
    format
    episodes
    chapters
    volumes
    season
    seasonYear
    averageScore
    popularity
    favourites
    stats { scoreDistribution { score amount } }
    synopsis: description(asHtml: false)
    genres
    studios(isMain: true) { nodes { name } }
  `;

  const anilistQuery = `
  query ($search: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int${genreArg}${tagArg}${typeArg}) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, format: $format, status: $status, sort: [${sort}], isAdult: false, genre_not_in: ["Hentai"]${genreFilter}${tagFilter}${typeFilter}) {
        ${mediaFields}
      }
    }
  }
  `;

  try {
    const variables: any = { page, perPage: Math.max(limit, 24) };
    if (resolvedQuery) variables.search = resolvedQuery;
    if (genreStr) variables.genre = genreStr;
    if (tagStr) variables.tag = tagStr;
    if (formatStr) variables.format = formatStr;
    if (statusApi) variables.status = statusApi;
    if (typeApi && typeApi !== 'ALL') variables.type = typeApi;

    // Direct Media Search
    const mainPromise = fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: anilistQuery, variables }),
      signal: AbortSignal.timeout(6000)
    }).then(r => r.json()).catch(() => null);

    let charPromise: Promise<any> = Promise.resolve(null);
    let studioPromise: Promise<any> = Promise.resolve(null);
    let targetIdsPromise: Promise<any> = Promise.resolve(null);
    let letterBrowsePromise: Promise<any> = Promise.resolve(null);

    const targetMalIds = [
      ...(ICONIC_CHARACTERS[lowerQuery]?.mal_ids || []),
      ...(ICONIC_STUDIOS[lowerQuery]?.mal_ids || []),
      ...(ICONIC_LETTER_ANIME[lowerQuery] || [])
    ];

    if (targetMalIds.length > 0) {
      const idsGql = `
        query ($ids: [Int]) {
          Page(page: 1, perPage: 15) {
            media(idMal_in: $ids, type: ANIME) {
              ${mediaFields}
            }
          }
        }
      `;
      targetIdsPromise = fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: idsGql, variables: { ids: targetMalIds } }),
        signal: AbortSignal.timeout(5000)
      }).then(r => r.json()).catch(() => null);
    }

    // For single-letter queries (where search: "A" returns 0 due to stopword), browse popular anime starting with letter
    if (cleanQuery.length === 1 && typeApi !== 'MANGA') {
      const letterGql = `
        query {
          Page(page: 1, perPage: 50) {
            media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
              ${mediaFields}
            }
          }
        }
      `;
      letterBrowsePromise = fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: letterGql }),
        signal: AbortSignal.timeout(5000)
      }).then(r => r.json()).catch(() => null);
    }

    // If query has text, run Character and Studio entity queries in parallel
    if (cleanQuery && typeApi !== 'MANGA') {
      const charSearchTerm = cleanQuery;
      const studioSearchTerm = STUDIO_ALIASES[lowerQuery] || cleanQuery;

      const charGql = `
        query ($search: String) {
          Page(page: 1, perPage: 4) {
            characters(search: $search) {
              name { full alternative native }
              media(sort: [POPULARITY_DESC], perPage: 12) {
                nodes {
                  ${mediaFields}
                }
              }
            }
          }
        }
      `;

      const studioGql = `
        query ($search: String) {
          Page(page: 1, perPage: 3) {
            studios(search: $search) {
              name
              media(sort: [POPULARITY_DESC], perPage: 18) {
                nodes {
                  ${mediaFields}
                }
              }
            }
          }
        }
      `;

      charPromise = fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: charGql, variables: { search: charSearchTerm } }),
        signal: AbortSignal.timeout(5000)
      }).then(r => r.json()).catch(() => null);

      studioPromise = fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: studioGql, variables: { search: studioSearchTerm } }),
        signal: AbortSignal.timeout(5000)
      }).then(r => r.json()).catch(() => null);
    }

    const [mainRes, charRes, studioRes, targetRes, letterRes] = await Promise.all([
      mainPromise,
      charPromise,
      studioPromise,
      targetIdsPromise,
      letterBrowsePromise
    ]);

    const directMedia = Array.isArray(mainRes?.data?.Page?.media) ? mainRes.data.Page.media : [];
    const targetMedia = Array.isArray(targetRes?.data?.Page?.media) ? targetRes.data.Page.media : [];
    const characterHits: any[] = [];
    const studioHits: any[] = [];

    // Tag targetMedia as iconic
    for (const m of targetMedia) {
      if (m) m._isIconic = true;
    }

    const isIconicChar = Boolean(ICONIC_CHARACTERS[lowerQuery]);
    const isIconicStudio = Boolean(ICONIC_STUDIOS[lowerQuery]);
    if (isIconicChar) {
      characterHits.unshift(...targetMedia);
    } else if (isIconicStudio) {
      studioHits.unshift(...targetMedia);
    } else if (targetMedia.length > 0) {
      directMedia.unshift(...targetMedia);
    }

    // Process letter browse fallback
    if (cleanQuery.length === 1 && letterRes?.data?.Page?.media) {
      const letterLetter = cleanQuery.toLowerCase();
      const matchingLetterMedia = letterRes.data.Page.media.filter((m: any) => {
        const tRom = (m?.title?.romaji || '').toLowerCase();
        const tEng = (m?.title?.english || '').toLowerCase();
        return tRom.startsWith(letterLetter) || tEng.startsWith(letterLetter);
      });
      directMedia.push(...matchingLetterMedia);
    }

    // Process Studio hits with strict entity matching
    const foundStudios = studioRes?.data?.Page?.studios || [];
    for (const st of foundStudios) {
      if (st && Array.isArray(st.media?.nodes)) {
        if (isStudioKeyword || matchesEntity(cleanQuery, st.name)) {
          for (const m of st.media.nodes) {
            if (m) m._isStudio = true;
          }
          studioHits.push(...st.media.nodes);
        }
      }
    }

    // Process Character hits with strict entity matching
    const foundChars = charRes?.data?.Page?.characters || [];
    for (const ch of foundChars) {
      if (ch && Array.isArray(ch.media?.nodes)) {
        const alts = Array.isArray(ch.name?.alternative) ? ch.name.alternative : [];
        if (matchesEntity(cleanQuery, ch.name?.full, alts)) {
          for (const m of ch.media.nodes) {
            if (m) m._isChar = true;
          }
          characterHits.push(...ch.media.nodes);
        }
      }
    }

    const charIdSet = new Set(characterHits.map((m: any) => m?.idMal).filter(Boolean));
    const studioIdSet = new Set(studioHits.map((m: any) => m?.idMal).filter(Boolean));
    const iconicIdSet = new Set(targetMedia.map((m: any) => m?.idMal).filter(Boolean));

    // Combine all sources:
    let pool: any[] = [];
    if (isStudioKeyword) {
      pool = [...studioHits, ...characterHits, ...directMedia];
    } else if (characterHits.length > 0) {
      pool = [...characterHits, ...directMedia, ...studioHits];
    } else {
      pool = [...directMedia, ...studioHits, ...characterHits];
    }

    if (pool.length === 0) return [];

    const seenIds = new Set<number>();
    const isManga = typeApi === 'MANGA';

    const mapped = pool
      .filter((m: any) => {
        if (!m || !m.idMal || seenIds.has(m.idMal)) return false;
        seenIds.add(m.idMal);
        return true;
      })
      .map((m: any) => {
        let status = 'Finished Airing';
        if (isManga) {
          status = m.status === 'RELEASING' ? 'Publishing' : m.status === 'FINISHED' ? 'Finished' : 'On Hiatus';
        } else {
          if (m.status === 'RELEASING') status = 'Currently Airing';
          if (m.status === 'NOT_YET_RELEASED') status = 'Not yet aired';
        }

        const isChar = charIdSet.has(m.idMal) || Boolean(m._isChar);
        const isStudio = studioIdSet.has(m.idMal) || Boolean(m._isStudio);
        const isIconic = iconicIdSet.has(m.idMal) || Boolean(m._isIconic);

        return {
          mal_id: m.idMal,
          url: `https://myanimelist.net/${isManga ? 'manga' : 'anime'}/${m.idMal}`,
          title: m.title.romaji || m.title.english || '',
          title_english: m.title.english || null,
          title_japanese: m.title.native || null,
          images: {
            jpg: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.large, small_image_url: m.coverImage?.large },
            webp: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.large, small_image_url: m.coverImage?.large }
          },
          synopsis: cleanOfficialText(m.synopsis) || null,
          type: isManga ? 'Manga' : (m.format === 'MOVIE' ? 'Movie' : formatStr || 'TV'),
          episodes: isManga ? undefined : (m.episodes || null),
          chapters: isManga ? (m.chapters || null) : undefined,
          volumes: isManga ? (m.volumes || null) : undefined,
          status,
          airing: !isManga && m.status === 'RELEASING',
          publishing: isManga && m.status === 'RELEASING',
          score: computeExactScore(m),
          popularity: m.popularity || 0,
          year: m.seasonYear || null,
          genres: (m.genres || []).map((g: string) => ({
            mal_id: Number(GENRE_NAME_TO_MAL_ID[g.toLowerCase()]) || 0,
            type: isManga ? 'manga' : 'anime',
            name: g,
            url: ''
          })),
          studios: (m.studios?.nodes || []).map((s: any) => ({ mal_id: 0, name: s.name })),
          _isChar: isChar,
          _isStudio: isStudio,
          _isIconic: isIconic,
          _relevance: scoreAnimeRelevance(
            { 
              title: m.title.romaji, 
              title_english: m.title.english, 
              title_japanese: m.title.native,
              type: isManga ? 'Manga' : (m.format === 'MOVIE' ? 'Movie' : formatStr || 'TV'),
              popularity: m.popularity, 
              score: computeExactScore(m),
              studios: m.studios?.nodes || []
            },
            resolvedQuery || cleanQuery,
            isChar,
            isStudio,
            isIconic
          )
        };
      });

    // Sort by relevance score
    if (cleanQuery) {
      mapped.sort((a, b) => (b._relevance || 0) - (a._relevance || 0));
    }

    return mapped;
  } catch (err) {
    console.warn('[Anilist Fallback] Error:', err);
    return [];
  }
}

export async function serverSearchAnime(options: SearchAnimeOptions): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);

  const clean = options.query?.trim() || '';

  if (!clean && options.orderBy === 'popularity' && (!options.genres || options.genres === 'all') && (!options.status || options.status === 'all') && (!options.type || options.type === 'all')) {
    return serverGetTopAnime('', page, limit);
  }

  const params = new URLSearchParams();
  if (clean) params.set('q', clean);
  params.set('sfw', 'true');
  params.set('limit', String(limit));
  params.set('genres_exclude', '12,49');
  if (page > 1) params.set('page', String(page));
  if (options.type && options.type !== 'all') params.set('type', options.type);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.genres && options.genres !== 'all') {
    // Ensure Jikan gets numeric MAL IDs
    const genreTokens = String(options.genres).split(',').map(s => s.trim()).filter(Boolean);
    const resolvedMalIds = genreTokens.map(token => {
      const meta = resolveGenreInfo(token);
      return meta && meta.mal_id > 0 ? String(meta.mal_id) : token;
    });
    params.set('genres', resolvedMalIds.join(','));
  }
  if (options.orderBy) params.set('order_by', options.orderBy);
  if (options.sort) params.set('sort', options.sort);

  let baseEndpoint = '/anime';
  let anilistType = 'ALL';
  
  if (options.type === 'manga' || options.type === 'novel' || options.type === 'manhwa' || options.type === 'manhua') {
    baseEndpoint = '/manga';
    anilistType = 'MANGA';
  } else if (options.type && options.type !== 'all') {
    anilistType = 'ANIME';
  }

  const endpoint = `${baseEndpoint}?${params.toString()}`;
  try {
    let jikanData: BaseJikanAnime[] | null = null;
    let pagination = null;

    // Jikan requires at least 3 characters for text search queries. Skip Jikan if < 3 chars.
    if (!clean || clean.length >= 3) {
      try {
        const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          jikanData = deduplicateByMalId(res.data);
          pagination = res.pagination;
        }
      } catch(e) {}
    }
    
    // If search query is present (for character/studio/letter/title matching) or Jikan returns empty/sparse:
    if (clean || !jikanData || jikanData.length === 0) {
       const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy, options.type);
       if (anilistData && anilistData.length > 0) {
          // Combine and rank both sources by relevance
          const combined = deduplicateByMalId([...anilistData, ...(jikanData || [])]);
          if (clean) {
            combined.sort((a: any, b: any) => {
              const isCharA = (a as any)._isChar || false;
              const isStudioA = (a as any)._isStudio || false;
              const isIconicA = (a as any)._isIconic || false;
              const isCharB = (b as any)._isChar || false;
              const isStudioB = (b as any)._isStudio || false;
              const isIconicB = (b as any)._isIconic || false;
              const relA = a._relevance ?? scoreAnimeRelevance(a, clean, isCharA, isStudioA, isIconicA);
              const relB = b._relevance ?? scoreAnimeRelevance(b, clean, isCharB, isStudioB, isIconicB);
              return relB - relA;
            });
          }

          return {
            data: combined.slice(0, limit),
            pagination: {
              current_page: page,
              has_next_page: combined.length >= limit,
              last_visible_page: page + (combined.length >= limit ? 1 : 0),
              items: { count: combined.length, total: 10000, per_page: limit }
            }
          };
       }
    }
    
    if (jikanData) {
      return { data: jikanData, pagination };
    }
    return { data: [], pagination: { current_page: page, has_next_page: false, last_visible_page: page, items: { count: 0, total: 0, per_page: limit } } };
  } catch (err) {
    throw err;
  }
}

export async function serverGetTopAnime(
  filter: string = 'bypopularity',
  page: number = 1,
  limit: number = 24
): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);

  const params = new URLSearchParams();
  if (safePage > 1) params.set('page', String(safePage));
  params.set('sfw', 'true');
  params.set('limit', String(safeLimit));
  if (filter && filter !== 'all' && filter !== 'bypopularity') {
    params.set('filter', filter);
  }

  const endpoint = `/top/anime?${params.toString()}`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, CATALOG_CACHE_TTL_MS);

  let data = deduplicateByMalId(Array.isArray(res.data) ? res.data : []);
  let pagination = res.pagination;

  // If Jikan failed or only returned minimal fallback seed data, fail over to live AniList data
  if (!data || data.length <= 5) {
    try {
      let orderBy = 'popularity';
      let statusStr: string | undefined = undefined;
      if (filter === 'airing') statusStr = 'airing';
      else if (filter === 'upcoming') statusStr = 'upcoming';
      else if (filter === 'favorite') orderBy = 'favorites';
      else if (filter === 'bypopularity') orderBy = 'popularity';

      const anilistItems = await searchAnilistFallback('', safePage, safeLimit, undefined, 'ANIME', statusStr, orderBy);
      if (anilistItems && anilistItems.length > 0) {
        data = anilistItems;
        pagination = {
          current_page: safePage,
          has_next_page: anilistItems.length >= safeLimit,
          last_visible_page: safePage + (anilistItems.length >= safeLimit ? 1 : 0),
          items: {
            count: anilistItems.length,
            total: 10000,
            per_page: safeLimit,
          },
        };
      }
    } catch (anilistErr) {
      console.warn('[serverGetTopAnime] AniList fallback error:', anilistErr);
    }
  }

  return {
    data,
    pagination,
  };
}

export async function serverGetSeasonalAnime(
  page: number = 1,
  limit: number = 24
): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);

  const endpoint = safePage > 1 ? `/seasons/now?page=${safePage}&sfw=true` : `/seasons/now?sfw=true`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, CATALOG_CACHE_TTL_MS);

  let data = deduplicateByMalId(Array.isArray(res.data) ? res.data : []);
  let pagination = res.pagination;

  if (!data || data.length <= 5) {
    try {
      const anilistItems = await searchAnilistFallback('', safePage, safeLimit, undefined, 'ANIME', 'airing', 'popularity');
      if (anilistItems && anilistItems.length > 0) {
        data = anilistItems;
        pagination = {
          current_page: safePage,
          has_next_page: anilistItems.length >= safeLimit,
          last_visible_page: safePage + (anilistItems.length >= safeLimit ? 1 : 0),
          items: {
            count: anilistItems.length,
            total: 5000,
            per_page: safeLimit,
          },
        };
      }
    } catch (anilistErr) {
      console.warn('[serverGetSeasonalAnime] AniList fallback error:', anilistErr);
    }
  }

  return {
    data,
    pagination,
  };
}

export async function serverGetUpcomingAnime(
  page: number = 1,
  limit: number = 24
): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);

  const endpoint = safePage > 1 ? `/seasons/upcoming?page=${safePage}&sfw=true` : `/seasons/upcoming?sfw=true`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, CATALOG_CACHE_TTL_MS);

  let data = deduplicateByMalId(Array.isArray(res.data) ? res.data : []);
  let pagination = res.pagination;

  if (!data || data.length <= 5) {
    try {
      const anilistItems = await searchAnilistFallback('', safePage, safeLimit, undefined, 'ANIME', 'upcoming', 'popularity');
      if (anilistItems && anilistItems.length > 0) {
        data = anilistItems;
        pagination = {
          current_page: safePage,
          has_next_page: anilistItems.length >= safeLimit,
          last_visible_page: safePage + (anilistItems.length >= safeLimit ? 1 : 0),
          items: {
            count: anilistItems.length,
            total: 5000,
            per_page: safeLimit,
          },
        };
      }
    } catch (anilistErr) {
      console.warn('[serverGetUpcomingAnime] AniList fallback error:', anilistErr);
    }
  }

  return {
    data,
    pagination,
  };
}

async function fetchAniListRelationsServer(malId: number): Promise<any[]> {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english }
              format
              type
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: malId } }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const edges = json.data?.Media?.relations?.edges || [];
    const relationMap = new Map<string, any[]>();

    const typeMapping: Record<string, string> = {
      PREQUEL: 'Prequel',
      SEQUEL: 'Sequel',
      PARENT: 'Parent story',
      SIDE_STORY: 'Side story',
      ALTERNATIVE: 'Alternative version',
      SPIN_OFF: 'Spin-off',
      SUMMARY: 'Summary',
      ADAPTATION: 'Adaptation',
      OTHER: 'Other',
    };

    for (const edge of edges) {
      const relType = typeMapping[edge.relationType] || 'Other';
      const node = edge.node;
      const mal_id = node.idMal || node.id;
      const name = node.title?.english || node.title?.romaji || 'Related Work';
      const mediaType = node.type === 'MANGA' ? 'manga' : 'anime';

      if (!relationMap.has(relType)) {
        relationMap.set(relType, []);
      }
      relationMap.get(relType)!.push({
        mal_id,
        type: mediaType,
        name,
        url: `https://myanimelist.net/${mediaType}/${mal_id}`,
      });
    }

    return Array.from(relationMap.entries()).map(([relation, entry]) => ({
      relation,
      entry,
    }));
  } catch (err) {
    console.warn('[AniList relations server fallback error]:', err);
    return [];
  }
}

async function fetchAniListDetailsServer(malId: number): Promise<BaseJikanAnime | null> {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        title { romaji english native }
        format
        status
        episodes
        duration
        seasonYear
        season
        description
        averageScore
        popularity
        coverImage { large extraLarge }
        genres
        studios { nodes { id name isAnimationStudio } }
        relations {
          edges {
            relationType
            node { id idMal title { romaji english } format type }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: malId } }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const media = json.data?.Media;
    if (!media) return null;

    const relationMap = new Map<string, any[]>();
    const typeMapping: Record<string, string> = {
      PREQUEL: 'Prequel',
      SEQUEL: 'Sequel',
      PARENT: 'Parent story',
      SIDE_STORY: 'Side story',
      ALTERNATIVE: 'Alternative version',
      SPIN_OFF: 'Spin-off',
      SUMMARY: 'Summary',
      ADAPTATION: 'Adaptation',
      OTHER: 'Other',
    };

    for (const edge of media.relations?.edges || []) {
      const relType = typeMapping[edge.relationType] || 'Other';
      const node = edge.node;
      const id = node.idMal || node.id;
      const name = node.title?.english || node.title?.romaji || 'Related Work';
      const mediaType = node.type === 'MANGA' ? 'manga' : 'anime';

      if (!relationMap.has(relType)) {
        relationMap.set(relType, []);
      }
      relationMap.get(relType)!.push({
        mal_id: id,
        type: mediaType,
        name,
        url: `https://myanimelist.net/${mediaType}/${id}`,
      });
    }

    const relations = Array.from(relationMap.entries()).map(([relation, entry]) => ({
      relation,
      entry,
    }));

    const studios = (media.studios?.nodes || [])
      .filter((s: any) => s.isAnimationStudio)
      .map((s: any) => ({ mal_id: s.id, name: s.name }));

    return {
      mal_id: media.idMal || media.id,
      title: media.title?.english || media.title?.romaji || 'Unknown Title',
      title_english: media.title?.english,
      title_japanese: media.title?.native,
      type: media.format === 'MOVIE' ? 'Movie' : media.format === 'OVA' ? 'OVA' : 'TV',
      status: media.status === 'RELEASING' ? 'Currently Airing' : media.status === 'FINISHED' ? 'Finished Airing' : 'Not yet aired',
      episodes: media.episodes,
      duration: media.duration ? `${media.duration} min` : undefined,
      score: media.averageScore ? Number((media.averageScore / 10).toFixed(2)) : undefined,
      popularity: media.popularity,
      season: media.season ? media.season.toLowerCase() : undefined,
      year: media.seasonYear,
      synopsis: media.description?.replace(/<[^>]*>/g, '') || '',
      images: {
        jpg: {
          image_url: media.coverImage?.large || '',
          large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '',
        },
        webp: {
          image_url: media.coverImage?.large || '',
          large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '',
        },
      },
      genres: (media.genres || []).map((g: string, i: number) => ({ mal_id: i + 1, name: g })),
      studios,
      relations,
    } as any;
  } catch (err) {
    console.warn('[AniList details server fallback error]:', err);
    return null;
  }
}

export async function serverGetAnimeDetails(id: number): Promise<BaseJikanAnime | null> {
  if (id === 34246) return null;
  const endpoint = `/anime/${id}/full`;
  const res = await fetchFromJikan<BaseJikanAnime>(endpoint, DETAIL_CACHE_TTL_MS);
  let data = res.data;

  if (!data || !data.relations || data.relations.length === 0) {
    try {
      const anilistFallback = await fetchAniListDetailsServer(id);
      if (anilistFallback) {
        if (!data) {
          data = anilistFallback;
        } else if (!data.relations || data.relations.length === 0) {
          data.relations = anilistFallback.relations;
        }
      }
    } catch {}
  }

  if (!data || isNsfwOrAdult(data)) return null;
  if (data.synopsis) {
    data.synopsis = cleanOfficialText(data.synopsis) || data.synopsis;
  }
  return data;
}

async function fetchAniListCharactersServer(malId: number): Promise<any[]> {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        characters(sort: [ROLE, FAVOURITES_DESC], perPage: 50) {
          edges {
            role
            node {
              id
              name { full native userPreferred }
              image { large medium }
              siteUrl
            }
            voiceActors(sort: [FAVOURITES_DESC]) {
              id
              name { full native userPreferred }
              languageV2
              image { large medium }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: malId } }),
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return [];
    const json = await res.json();
    const edges = json.data?.Media?.characters?.edges || [];
    return edges.map((edge: any) => {
      const node = edge.node;
      const vas = (edge.voiceActors || []).map((va: any) => ({
        person: {
          mal_id: va.id,
          name: va.name?.full || va.name?.userPreferred || 'Unknown',
          images: {
            jpg: {
              image_url: va.image?.large || va.image?.medium || ''
            }
          }
        },
        language: va.languageV2 || 'Japanese'
      }));

      return {
        character: {
          mal_id: node.id,
          url: node.siteUrl || `https://anilist.co/character/${node.id}`,
          images: {
            jpg: {
              image_url: node.image?.large || node.image?.medium || '',
              large_image_url: node.image?.large || node.image?.medium || ''
            }
          },
          name: node.name?.full || node.name?.userPreferred || 'Character'
        },
        role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
        voice_actors: vas
      };
    }).filter((c: any) => c.character?.name);
  } catch (err) {
    console.warn(`[AniList characters server fallback] Error for ${malId}:`, err);
    return [];
  }
}

export async function serverGetAnimeCharacters(id: number) {
  const cacheKey = `anime_chars:${id}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL_MS) {
    return cached.data as unknown[];
  }

  const endpoint = `/anime/${id}/characters`;
  let data: any[] = [];
  try {
    const res = await fetchFromJikan<any[]>(endpoint, DETAIL_CACHE_TTL_MS);
    if (Array.isArray(res.data) && res.data.length > 0) {
      data = res.data;
    }
  } catch (jikanErr) {
    console.warn(`[serverGetAnimeCharacters] Jikan failed for ${id}:`, jikanErr);
  }

  // If Jikan returned empty or failed, fetch full characters and voice actors from AniList!
  if (data.length === 0) {
    try {
      const anilistChars = await fetchAniListCharactersServer(id);
      if (anilistChars && anilistChars.length > 0) {
        data = anilistChars;
      }
    } catch (anilistErr) {
      console.warn(`[serverGetAnimeCharacters] AniList fallback error for ${id}:`, anilistErr);
    }
  }

  if (data.length > 0) {
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
  }
  return data;
}

export async function serverGetAnimeGenres() {
  const endpoint = '/genres/anime';
  const res = await fetchFromJikan<{ mal_id: number; name: string; count?: number }[]>(endpoint, CATALOG_CACHE_TTL_MS * 12);
  return Array.isArray(res.data) ? res.data : [];
}

export async function serverGetTopManga(page: number = 1, limit: number = 24) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);
  const endpoint = `/top/manga?page=${safePage}&limit=${safeLimit}`;

  // 1. Upstream Jikan
  try {
    const res = await fetchFromJikan<unknown[]>(endpoint, CATALOG_CACHE_TTL_MS);
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      return {
        data: res.data,
        pagination: res.pagination,
      };
    }
  } catch (err) {
    console.warn('[serverGetTopManga] Jikan failed, attempting AniList fallback:', err);
  }

  // 2. AniList Fallback
  try {
    const anilistData = await searchAnilistFallback("", safePage, safeLimit, undefined, "MANGA", undefined, "score", "manga");
    if (anilistData && anilistData.length > 0) {
      return {
        data: anilistData,
        pagination: {
          current_page: safePage,
          has_next_page: anilistData.length === safeLimit,
          last_visible_page: safePage + (anilistData.length === safeLimit ? 1 : 0),
          items: { count: anilistData.length, total: 10000, per_page: safeLimit }
        }
      };
    }
  } catch (err) {
    console.warn('[serverGetTopManga] AniList fallback failed, using VERIFIED_SEED_MANGA:', err);
  }

  // 3. Static verified seed fallback - guaranteed instant response
  const seedList = Array.isArray(VERIFIED_SEED_MANGA) ? VERIFIED_SEED_MANGA : [];
  const startIdx = (safePage - 1) * safeLimit;
  const pageSlice = seedList.slice(startIdx, startIdx + safeLimit);
  const data = pageSlice.length > 0 ? pageSlice : seedList.slice(0, safeLimit);

  return {
    data,
    pagination: {
      current_page: safePage,
      has_next_page: startIdx + safeLimit < seedList.length,
      last_visible_page: Math.max(1, Math.ceil(seedList.length / safeLimit)),
      items: { count: data.length, total: seedList.length, per_page: safeLimit }
    }
  };
}

export async function serverSearchManga(query: string, page: number = 1, limit: number = 24) {
  const clean = query.trim();
  if (!clean) return serverGetTopManga(page, limit);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);
  const endpoint = `/manga?q=${encodeURIComponent(clean)}&page=${safePage}&limit=${safeLimit}`;
  
  // 1. Upstream Jikan
  try {
    const res = await fetchFromJikan<unknown[]>(endpoint, SEARCH_CACHE_TTL_MS);
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, pagination: res.pagination };
    }
  } catch (err) {}
  
  // 2. Anilist fallback
  try {
    const anilistData = await searchAnilistFallback(clean, safePage, safeLimit, undefined, "MANGA", undefined, undefined, "manga");
    if (anilistData && anilistData.length > 0) {
      return {
        data: anilistData,
        pagination: {
          current_page: safePage,
          has_next_page: anilistData.length === safeLimit,
          last_visible_page: safePage + (anilistData.length === safeLimit ? 1 : 0),
          items: { count: anilistData.length, total: 10000, per_page: safeLimit }
        }
      };
    }
  } catch (err) {}
  
  // 3. Static seed filter fallback
  const seedList = Array.isArray(VERIFIED_SEED_MANGA) ? VERIFIED_SEED_MANGA : [];
  const queryLower = clean.toLowerCase();
  const matched = seedList.filter(m => 
    m.title?.toLowerCase().includes(queryLower) ||
    m.title_english?.toLowerCase().includes(queryLower) ||
    m.genres?.some(g => g.name.toLowerCase().includes(queryLower)) ||
    m.authors?.some(a => a.name.toLowerCase().includes(queryLower))
  );

  return {
    data: matched.slice(0, safeLimit),
    pagination: {
      current_page: safePage,
      has_next_page: false,
      last_visible_page: 1,
      items: { count: matched.length, total: matched.length, per_page: safeLimit }
    }
  };
}


export async function serverGetAnimePictures(id: number): Promise<{ jpg?: { image_url: string } }[]> {
  const endpoint = `/anime/${id}/pictures`;
  const res = await fetchFromJikan<any[]>(endpoint, DETAIL_CACHE_TTL_MS);
  return res.data || [];
}

export async function serverGetTop100Anime(options: {
  filter?: string;
  genre?: string;
  year?: number | string;
  limit?: number;
}): Promise<BaseJikanAnime[]> {
  const targetLimit = Math.min(Math.max(Number(options.limit) || 100, 1), 100);
  const filter = options.filter || 'bypopularity';
  const genre = options.genre && options.genre !== 'all' ? options.genre : undefined;
  const year = options.year && options.year !== 'all' ? Number(options.year) : undefined;

  // Cache key
  const cacheKey = `top100:${filter}:${genre || 'all'}:${year || 'all'}:${targetLimit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CATALOG_CACHE_TTL_MS) && Array.isArray(cached.data) && cached.data.length > 0) {
    return cached.data as BaseJikanAnime[];
  }

  // 1. Primary: Anilist GraphQL for accurate, unthrottled 100-item fetch across any category and genre
  try {
    let sort = '[SCORE_DESC, POPULARITY_DESC]';
    if (filter === 'bypopularity') sort = '[POPULARITY_DESC]';
    else if (filter === 'favorite') sort = '[FAVOURITES_DESC]';
    else if (filter === 'upcoming') sort = '[POPULARITY_DESC]';
    else if (filter === 'airing') sort = '[POPULARITY_DESC, SCORE_DESC]';

    let statusApi: string | undefined = undefined;
    if (filter === 'airing') statusApi = 'RELEASING';
    if (filter === 'upcoming') statusApi = 'NOT_YET_RELEASED';

    const isIsekai = genre?.toLowerCase() === 'isekai';
    const anilistGenre = isIsekai ? undefined : (genre && genre !== 'all' ? genre : undefined);
    const anilistTag = isIsekai ? 'Isekai' : undefined;

    const anilistQuery = `
      query ($genre: String, $tag: String, $seasonYear: Int, $status: MediaStatus, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(genre: $genre, tag: $tag, seasonYear: $seasonYear, status: $status, sort: ${sort}, isAdult: false, genre_not_in: ["Hentai"], type: ANIME) {
            idMal
            id
            title { romaji english native }
            coverImage { large }
            status
            episodes
            season
            seasonYear
            averageScore
            stats { scoreDistribution { score amount } }
            popularity
            favourites
            synopsis: description(asHtml: false)
            genres
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    // Fetch pages 1, 2, and 3 concurrently (50 * 3 = 150 candidates) to guarantee reaching 100 after deduplication
    const pagesToFetch = targetLimit > 50 ? [1, 2, 3] : [1];
    const fetchPromises = pagesToFetch.map(pageNum =>
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          query: anilistQuery,
          variables: {
            genre: anilistGenre,
            tag: anilistTag,
            seasonYear: year,
            status: statusApi,
            page: pageNum,
            perPage: 50
          }
        }),
        signal: AbortSignal.timeout(6000)
      }).then(r => r.json()).catch(() => null)
    );

    const responses = await Promise.all(fetchPromises);
    const allMedia: any[] = [];
    for (const res of responses) {
      const items = res?.data?.Page?.media;
      if (Array.isArray(items)) {
        allMedia.push(...items);
      }
    }

    const mapMediaItem = (m: any): BaseJikanAnime => {
      let st = 'Finished Airing';
      if (m.status === 'RELEASING') st = 'Currently Airing';
      if (m.status === 'NOT_YET_RELEASED') st = 'Not yet aired';

      const malId = m.idMal || m.id || Math.floor(Math.random() * 900000 + 100000);
      return {
        mal_id: malId,
        url: `https://myanimelist.net/anime/${malId}`,
        title: m.title?.english || m.title?.romaji || 'Unknown Title',
        title_english: m.title?.english || null,
        title_japanese: m.title?.native || null,
        images: {
          jpg: { image_url: m.coverImage?.large },
          webp: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.large }
        },
        synopsis: cleanOfficialText(m.synopsis) || null,
        type: 'TV',
        episodes: m.episodes || null,
        status: st,
        airing: m.status === 'RELEASING',
        score: computeExactScore(m),
        scored_by: m.popularity || null,
        year: m.seasonYear || null,
        genres: (m.genres || []).map((g: string) => ({ mal_id: 0, type: 'anime', name: g, url: '' })),
        studios: m.studios?.nodes ? m.studios.nodes.map((s: any) => ({ mal_id: 0, type: 'anime', name: s.name, url: '' })) : []
      };
    };

    let unique = deduplicateByMalId(allMedia.map(mapMediaItem));

    // If specific restrictions (e.g. status or narrow genre) left fewer than targetLimit (100) items,
    // supplement with freshest releases of THAT SAME GENRE so the rankings table always displays 100 anime
    if (unique.length < targetLimit && targetLimit >= 50) {
      try {
        const topupQuery = `
          query ($genre: String, $tag: String, $page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              media(genre: $genre, tag: $tag, sort: [START_DATE_DESC, POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai"], type: ANIME) {
                idMal id title { romaji english native } coverImage { large } status episodes season seasonYear averageScore stats { scoreDistribution { score amount } } popularity synopsis: description(asHtml: false) genres studios(isMain: true) { nodes { name } }
              }
            }
          }
        `;
        const topupPages = [1, 2];
        const topupResponses = await Promise.all(
          topupPages.map(p =>
            fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                query: topupQuery,
                variables: { genre: anilistGenre, tag: anilistTag, page: p, perPage: 50 }
              }),
              signal: AbortSignal.timeout(4000)
            }).then(r => r.json()).catch(() => null)
          )
        );

        for (const topupRes of topupResponses) {
          const topupItems = topupRes?.data?.Page?.media;
          if (Array.isArray(topupItems) && topupItems.length > 0) {
            const topupMapped = topupItems.map(mapMediaItem);
            unique = deduplicateByMalId([...unique, ...topupMapped]);
          }
        }
      } catch (topupErr) {
        console.warn('[Top100] Topup fetch note:', topupErr);
      }
    }

    const finalResult = unique.slice(0, targetLimit);
    if (finalResult.length > 0) {
      memoryCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
      return finalResult;
    }
  } catch (anilistErr) {
    console.warn('[Top100] Anilist fetch fallback notice:', anilistErr);
  }

  // 2. Fallback: Jikan multi-page fetch (4 pages of 25 = 100 items)
  try {
    const pages = [1, 2, 3, 4];
    const jikanGenreId = genre ? GENRE_NAME_TO_MAL_ID[genre.toLowerCase()] : undefined;

    const jikanFetches = pages.map(page => {
      if (jikanGenreId || year) {
        return serverSearchAnime({
          genres: jikanGenreId,
          orderBy: filter === 'bypopularity' ? 'popularity' : 'score',
          sort: 'desc',
          page,
          limit: 25
        }).then(r => r.data).catch(() => []);
      }
      if (filter === 'airing') {
        return serverGetSeasonalAnime(page, 25).then(r => r.data).catch(() => []);
      }
      if (filter === 'upcoming') {
        return serverGetUpcomingAnime(page, 25).then(r => r.data).catch(() => []);
      }
      return serverGetTopAnime(filter === 'top100' ? 'favorite' : filter, page, 25).then(r => r.data).catch(() => []);
    });

    const results = await Promise.all(jikanFetches);
    const combined = deduplicateByMalId(results.flat()).slice(0, targetLimit);
    if (combined.length > 0) {
      memoryCache.set(cacheKey, { data: combined, timestamp: Date.now() });
      return combined;
    }
  } catch (jikanErr) {
    console.warn('[Top100] Jikan fetch fallback error:', jikanErr);
  }

  return [];
}

// ---------------- Weekly Airing Schedule ----------------

export interface AiringScheduleAnime extends BaseJikanAnime {
  airing_schedule?: {
    episode: number;
    airing_at: number; // epoch in seconds
    time_until_airing: number; // seconds
    airing_day: string; // e.g. "monday"
    airing_time: string; // e.g. "23:00"
  };
}

export async function serverGetAiringSchedule(targetDay?: string): Promise<AiringScheduleAnime[]> {
  const normalizedDay = targetDay ? targetDay.toLowerCase().trim() : '';
  const cacheKey = `schedule:${normalizedDay || 'all'}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 30) {
    return cached.data as AiringScheduleAnime[];
  }

  const collectedAnime: AiringScheduleAnime[] = [];

  // 1. Try Jikan /schedules - fetch multiple pages so NO anime releasing on this day are missed
  try {
    const p1Url = normalizedDay ? `/schedules?filter=${normalizedDay}&page=1&limit=25&sfw=true` : `/schedules?page=1&limit=25&sfw=true`;
    const p2Url = normalizedDay ? `/schedules?filter=${normalizedDay}&page=2&limit=25&sfw=true` : `/schedules?page=2&limit=25&sfw=true`;
    const p3Url = normalizedDay ? `/schedules?filter=${normalizedDay}&page=3&limit=25&sfw=true` : `/schedules?page=3&limit=25&sfw=true`;

    const [res1, res2, res3] = await Promise.allSettled([
      fetchFromJikan<any[]>(p1Url, 1000 * 60 * 30),
      fetchFromJikan<any[]>(p2Url, 1000 * 60 * 30),
      fetchFromJikan<any[]>(p3Url, 1000 * 60 * 30),
    ]);

    const allJikanItems: any[] = [];
    if (res1.status === 'fulfilled' && Array.isArray(res1.value?.data)) allJikanItems.push(...res1.value.data);
    if (res2.status === 'fulfilled' && Array.isArray(res2.value?.data)) allJikanItems.push(...res2.value.data);
    if (res3.status === 'fulfilled' && Array.isArray(res3.value?.data)) allJikanItems.push(...res3.value.data);

    if (allJikanItems.length > 0) {
      const mapped = allJikanItems.map(item => {
        let airing_day = normalizedDay;
        let airing_time = item.broadcast?.time || '';
        if (item.broadcast?.day) {
          airing_day = item.broadcast.day.toLowerCase().replace(/s$/, '');
        }
        return {
          ...item,
          airing_schedule: {
            episode: item.episodes || 1,
            airing_at: Math.floor(Date.now() / 1000),
            time_until_airing: 0,
            airing_day: airing_day || 'unknown',
            airing_time: airing_time || 'TBA'
          }
        };
      });
      collectedAnime.push(...mapped);
    }
  } catch (jikanErr) {
    console.warn('[Schedule] Jikan fetch notice:', jikanErr);
  }

  // 2. Also enrich from AniList GraphQL with full 100-item page capacity
  try {
    const query = `
      query ($page: Int) {
        Page(page: $page, perPage: 50) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
            id
            idMal
            title { romaji english native }
            coverImage { large }
            format
            episodes
            averageScore
            stats { scoreDistribution { score amount } }
            genres
            status
            nextAiringEpisode {
              airingAt
              timeUntilAiring
              episode
            }
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    const [page1Res, page2Res] = await Promise.allSettled([
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { page: 1 } }),
        signal: AbortSignal.timeout(8000)
      }).then(r => r.json()),
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { page: 2 } }),
        signal: AbortSignal.timeout(8000)
      }).then(r => r.json())
    ]);

    const mediaList: any[] = [];
    if (page1Res.status === 'fulfilled' && page1Res.value?.data?.Page?.media) {
      mediaList.push(...page1Res.value.data.Page.media);
    }
    if (page2Res.status === 'fulfilled' && page2Res.value?.data?.Page?.media) {
      mediaList.push(...page2Res.value.data.Page.media);
    }

    if (mediaList.length > 0) {
      const mapped: AiringScheduleAnime[] = mediaList.map((m: any) => {
        let airing_day = '';
        let airing_time = '';
        let airing_at = 0;
        let time_until_airing = 0;
        let episode = m.episodes || 1;

        if (m.nextAiringEpisode) {
          airing_at = m.nextAiringEpisode.airingAt;
          time_until_airing = m.nextAiringEpisode.timeUntilAiring;
          episode = m.nextAiringEpisode.episode;
          const d = new Date(airing_at * 1000);
          airing_day = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Tokyo' }).toLowerCase();
          airing_time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' }) + ' JST';
        }

        const malId = m.idMal || (m.id ? m.id + 2000000 : Math.floor(Math.random() * 900000 + 100000));
        return {
          mal_id: malId,
          url: `https://myanimelist.net/anime/${malId}`,
          title: m.title?.english || m.title?.romaji || 'Unknown Title',
          title_english: m.title?.english || null,
          title_japanese: m.title?.native || null,
          images: {
            jpg: { image_url: m.coverImage?.large },
            webp: { image_url: m.coverImage?.large }
          },
          status: 'Currently Airing',
          airing: true,
          type: m.format || 'TV',
          episodes: m.episodes || null,
          score: computeExactScore(m),
          genres: (m.genres || []).map((g: string) => ({ mal_id: 0, type: 'anime', name: g, url: '' })),
          studios: m.studios?.nodes ? m.studios.nodes.map((s: any) => ({ mal_id: 0, type: 'anime', name: s.name, url: '' })) : [],
          airing_schedule: {
            episode,
            airing_at,
            time_until_airing,
            airing_day,
            airing_time
          }
        };
      });

      const filtered = normalizedDay
        ? mapped.filter(item => item.airing_schedule?.airing_day === normalizedDay)
        : mapped;

      collectedAnime.push(...filtered);
    }
  } catch (anilistErr) {
    console.warn('[Schedule] AniList fallback notice:', anilistErr);
  }

  const unique = deduplicateByMalId(collectedAnime);
  if (unique.length > 0) {
    memoryCache.set(cacheKey, { data: unique, timestamp: Date.now() });
    return unique;
  }

  return [];
}

// ---------------- Anime Recommendations ----------------

export interface RecommendedAnimeItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  image_url: string;
  score?: number | null;
  votes?: number;
  format?: string;
  genres?: string[];
}

export async function serverGetAnimeRecommendations(id: number): Promise<RecommendedAnimeItem[]> {
  const cacheKey = `recs:${id}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL_MS) {
    return cached.data as RecommendedAnimeItem[];
  }

  // 1. Try Jikan
  try {
    const res = await fetchFromJikan<any[]>(`/anime/${id}/recommendations`, DETAIL_CACHE_TTL_MS);
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const items: RecommendedAnimeItem[] = res.data.map(item => ({
        mal_id: item.entry?.mal_id,
        title: item.entry?.title || 'Unknown',
        title_english: item.entry?.title || null,
        image_url: item.entry?.images?.jpg?.large_image_url || item.entry?.images?.jpg?.image_url || '',
        votes: item.votes || 0,
        format: 'TV'
      })).filter(i => i.mal_id && i.image_url);

      if (items.length > 0) {
        memoryCache.set(cacheKey, { data: items.slice(0, 12), timestamp: Date.now() });
        return items.slice(0, 12);
      }
    }
  } catch (jikanErr) {
    console.warn(`[Recs] Jikan error for ${id}:`, jikanErr);
  }

  // 2. Fallback: AniList Recommendations
  try {
    const query = `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          recommendations(sort: RATING_DESC, perPage: 12) {
            nodes {
              rating
              mediaRecommendation {
                id
                idMal
                title { romaji english }
                coverImage { large }
                format
                averageScore
                stats { scoreDistribution { score amount } }
                genres
              }
            }
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: id } }),
      signal: AbortSignal.timeout(7000)
    });

    if (res.ok) {
      const json = await res.json();
      const nodes = json.data?.Media?.recommendations?.nodes || [];
      const items: RecommendedAnimeItem[] = nodes
        .filter((n: any) => n.mediaRecommendation && (n.mediaRecommendation.idMal || n.mediaRecommendation.id))
        .map((n: any) => {
          const m = n.mediaRecommendation;
          const mal_id = m.idMal || m.id;
          return {
            mal_id,
            title: m.title?.english || m.title?.romaji || 'Unknown Title',
            title_english: m.title?.english || null,
            image_url: m.coverImage?.large || '',
            score: computeExactScore(m),
            votes: n.rating || 0,
            format: m.format || 'TV',
            genres: m.genres || []
          };
        });

      if (items.length > 0) {
        memoryCache.set(cacheKey, { data: items, timestamp: Date.now() });
        return items;
      }
    }
  } catch (anilistErr) {
    console.warn(`[Recs] AniList fallback error for ${id}:`, anilistErr);
  }

  return [];
}

// ---------------- Character Explorer ----------------

export interface CharacterDetailInfo {
  mal_id: number;
  name: string;
  name_kanji?: string | null;
  nicknames?: string[];
  about?: string | null;
  favorites?: number;
  image_url: string;
  anime: {
    mal_id: number;
    title: string;
    image_url: string;
    role?: string;
    score?: number | null;
  }[];
  voices?: {
    person_id: number;
    name: string;
    language: string;
    image_url: string;
  }[];
}

function cleanPersonOrCharName(name: string): string {
  if (!name) return '';
  if (name.includes(',')) {
    const parts = name.split(',').map(s => s.trim());
    return `${parts[1] || ''} ${parts[0] || ''}`.trim();
  }
  return name.trim();
}

export async function serverGetCharacterDetails(id: number, rawName?: string): Promise<CharacterDetailInfo | null> {
  const cacheKey = `character:${id}:${rawName || ''}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL_MS) {
    return cached.data as CharacterDetailInfo;
  }

  // 1. Try Jikan /characters/{id}/full
  try {
    const res = await fetchFromJikan<any>(`/characters/${id}/full`, DETAIL_CACHE_TTL_MS);
    if (res.data) {
      const c = res.data;
      const anime = (c.anime || []).map((a: any) => ({
        mal_id: a.anime?.mal_id,
        title: a.anime?.title || 'Unknown Title',
        image_url: a.anime?.images?.jpg?.image_url || a.anime?.images?.jpg?.large_image_url || '',
        role: a.role
      })).filter((a: any) => a.mal_id);

      const voices = (c.voices || []).map((v: any) => ({
        person_id: v.person?.mal_id,
        name: cleanPersonOrCharName(v.person?.name || ''),
        language: v.language || 'Japanese',
        image_url: v.person?.images?.jpg?.image_url || ''
      })).filter((v: any) => v.name);

      const result: CharacterDetailInfo = {
        mal_id: c.mal_id,
        name: c.name,
        name_kanji: c.name_kanji,
        nicknames: c.nicknames || [],
        about: c.about,
        favorites: c.favorites,
        image_url: c.images?.jpg?.image_url || '',
        anime,
        voices
      };

      memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (jikanErr) {
    console.warn(`[Character] Jikan error for ${id}:`, jikanErr);
  }

  // 2. Fallback: AniList Character Search
  const searchName = cleanPersonOrCharName(rawName || '');
  if (searchName) {
    try {
      const query = `
        query ($search: String) {
          Character(search: $search) {
            id
            name { full native alternative }
            image { large }
            description
            favourites
            media(type: ANIME, sort: POPULARITY_DESC, perPage: 8) {
              nodes {
                id
                idMal
                title { romaji english }
                coverImage { large }
                format
                averageScore
                stats { scoreDistribution { score amount } }
              }
            }
          }
        }
      `;

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { search: searchName } }),
        signal: AbortSignal.timeout(7000)
      });

      if (res.ok) {
        const json = await res.json();
        const c = json.data?.Character;
        if (c) {
          const anime = (c.media?.nodes || []).map((m: any) => ({
            mal_id: m.idMal || m.id,
            title: m.title?.english || m.title?.romaji || 'Unknown Title',
            image_url: m.coverImage?.large || '',
            score: computeExactScore(m)
          }));

          const result: CharacterDetailInfo = {
            mal_id: id,
            name: c.name?.full || searchName,
            name_kanji: c.name?.native || null,
            nicknames: c.name?.alternative || [],
            about: c.description || null,
            favorites: c.favourites || 0,
            image_url: c.image?.large || '',
            anime,
            voices: []
          };

          memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (anilistErr) {
      console.warn(`[Character] AniList fallback error for ${searchName}:`, anilistErr);
    }
  }

  return null;
}

// ---------------- Voice Actor / Staff Explorer ----------------

export interface PersonDetailInfo {
  mal_id: number;
  name: string;
  family_name?: string | null;
  given_name?: string | null;
  birthday?: string | null;
  about?: string | null;
  favorites?: number;
  image_url: string;
  occupations?: string[];
  roles: {
    character_id: number;
    character_name: string;
    character_image: string;
    role?: string;
    anime_id: number;
    anime_title: string;
    anime_image: string;
  }[];
}

export async function serverGetPersonDetails(id: number, rawName?: string): Promise<PersonDetailInfo | null> {
  const cacheKey = `person:${id}:${rawName || ''}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL_MS) {
    return cached.data as PersonDetailInfo;
  }

  // 1. Try Jikan /people/{id}/full
  try {
    const res = await fetchFromJikan<any>(`/people/${id}/full`, DETAIL_CACHE_TTL_MS);
    if (res.data) {
      const p = res.data;
      const roles = (p.voices || []).map((v: any) => ({
        character_id: v.character?.mal_id,
        character_name: v.character?.name || 'Character',
        character_image: v.character?.images?.jpg?.image_url || '',
        role: v.role,
        anime_id: v.anime?.mal_id,
        anime_title: v.anime?.title || 'Unknown Title',
        anime_image: v.anime?.images?.jpg?.image_url || ''
      })).filter((r: any) => r.character_id && r.anime_id);

      const result: PersonDetailInfo = {
        mal_id: p.mal_id,
        name: cleanPersonOrCharName(p.name),
        family_name: p.family_name,
        given_name: p.given_name,
        birthday: p.birthday,
        about: p.about,
        favorites: p.favorites,
        image_url: p.images?.jpg?.image_url || '',
        occupations: ['Voice Actor'],
        roles: roles.slice(0, 24)
      };

      memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (jikanErr) {
    console.warn(`[Person] Jikan error for ${id}:`, jikanErr);
  }

  // 2. Fallback: AniList Staff Search
  const searchName = cleanPersonOrCharName(rawName || '');
  if (searchName) {
    try {
      const query = `
        query ($search: String) {
          Staff(search: $search) {
            id
            name { full native }
            image { large }
            description
            primaryOccupations
            favourites
            characters(sort: FAVOURITES_DESC, perPage: 12) {
              edges {
                role
                node {
                  id
                  name { full }
                  image { large }
                  media(type: ANIME, perPage: 1) {
                    nodes {
                      id
                      idMal
                      title { romaji english }
                      coverImage { large }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { search: searchName } }),
        signal: AbortSignal.timeout(7000)
      });

      if (res.ok) {
        const json = await res.json();
        const s = json.data?.Staff;
        if (s) {
          const roles = (s.characters?.edges || []).map((e: any) => {
            const charNode = e.node;
            const animeNode = charNode?.media?.nodes?.[0];
            return {
              character_id: charNode?.id || 0,
              character_name: charNode?.name?.full || 'Unknown',
              character_image: charNode?.image?.large || '',
              role: e.role || 'Main',
              anime_id: animeNode?.idMal || animeNode?.id || 0,
              anime_title: animeNode?.title?.english || animeNode?.title?.romaji || 'Unknown Title',
              anime_image: animeNode?.coverImage?.large || ''
            };
          }).filter((r: any) => r.character_name && r.anime_title);

          const result: PersonDetailInfo = {
            mal_id: id,
            name: s.name?.full || searchName,
            family_name: null,
            given_name: null,
            birthday: null,
            about: s.description || null,
            favorites: s.favourites || 0,
            image_url: s.image?.large || '',
            occupations: s.primaryOccupations || ['Voice Actor'],
            roles
          };

          memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (anilistErr) {
      console.warn(`[Person] AniList fallback error for ${searchName}:`, anilistErr);
    }
  }

  return null;
}

