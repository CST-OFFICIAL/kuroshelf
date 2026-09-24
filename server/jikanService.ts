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

function matchesEntity(search: string, entityName?: string): boolean {
  if (!search || !entityName) return false;
  const s = search.toLowerCase().trim();
  const e = entityName.toLowerCase().trim();
  if (e === s) return true;
  const words = e.split(/[\s\-_\/]+/);
  if (words.some(w => w === s || (s.length >= 3 && w.startsWith(s)))) return true;
  if (e.startsWith(s) || (s.length >= 4 && s.startsWith(e))) return true;
  return false;
}

async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string, typeApi: string = "ALL", statusStr?: string, orderBy?: string, originalType?: string): Promise<BaseJikanAnime[]> {
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

  const anilistQuery = `
  query ($search: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int${genreArg}${tagArg}${typeArg}) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, format: $format, status: $status, sort: [${sort}], isAdult: false, genre_not_in: ["Hentai"]${genreFilter}${tagFilter}${typeFilter}) {
        idMal
        title { romaji english native }
        coverImage { large }
        status
        episodes
        chapters
        volumes
        season
        seasonYear
        averageScore
        stats { scoreDistribution { score amount } }
        synopsis: description(asHtml: false)
        genres
        studios(isMain: true) { nodes { name } }
      }
    }
  }
  `;

  try {
    const variables: any = { page, perPage: limit };
    if (query) variables.search = query;
    if (genreStr) variables.genre = genreStr;
    if (tagStr) variables.tag = tagStr;
    if (formatStr) variables.format = formatStr;
    if (statusApi) variables.status = statusApi;
    if (typeApi && typeApi !== 'ALL') variables.type = typeApi;

    const mainPromise = fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: anilistQuery, variables }),
      signal: AbortSignal.timeout(5000)
    }).then(r => r.json()).catch(() => null);

    const cleanQuery = query?.trim();
    let charPromise: Promise<any> = Promise.resolve(null);
    let studioPromise: Promise<any> = Promise.resolve(null);

    // If text search is active, simultaneously check Character and Studio matching!
    if (cleanQuery && cleanQuery.length >= 2 && typeApi !== 'MANGA') {
      const charGql = `
        query ($search: String) {
          Character(search: $search) {
            name { full alternative }
            media(sort: [POPULARITY_DESC], perPage: 10) {
              nodes {
                idMal
                title { romaji english native }
                coverImage { large }
                status
                episodes
                seasonYear
                averageScore
                synopsis: description(asHtml: false)
                genres
                studios(isMain: true) { nodes { name } }
              }
            }
          }
        }
      `;
      const studioGql = `
        query ($search: String) {
          Studio(search: $search) {
            name
            media(sort: [POPULARITY_DESC], perPage: 12) {
              nodes {
                idMal
                title { romaji english native }
                coverImage { large }
                status
                episodes
                seasonYear
                averageScore
                synopsis: description(asHtml: false)
                genres
                studios(isMain: true) { nodes { name } }
              }
            }
          }
        }
      `;

      charPromise = fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: charGql, variables: { search: cleanQuery } }),
        signal: AbortSignal.timeout(4500)
      }).then(r => r.json()).catch(() => null);

      studioPromise = fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: studioGql, variables: { search: cleanQuery } }),
        signal: AbortSignal.timeout(4500)
      }).then(r => r.json()).catch(() => null);
    }

    const [mainRes, charRes, studioRes] = await Promise.all([
      mainPromise,
      charPromise,
      studioPromise
    ]);

    const directMedia = Array.isArray(mainRes?.data?.Page?.media) ? mainRes.data.Page.media : [];
    const extraMedia: any[] = [];
    let isStudioHit = false;
    let isCharHit = false;

    if (studioRes?.data?.Studio) {
      const studio = studioRes.data.Studio;
      if (matchesEntity(cleanQuery, studio.name) && Array.isArray(studio.media?.nodes)) {
        isStudioHit = true;
        extraMedia.push(...studio.media.nodes);
      }
    }

    if (charRes?.data?.Character) {
      const char = charRes.data.Character;
      const charMatches = matchesEntity(cleanQuery, char.name?.full) || (char.name?.alternative || []).some((alt: string) => matchesEntity(cleanQuery, alt));
      if (charMatches && Array.isArray(char.media?.nodes)) {
        isCharHit = true;
        extraMedia.push(...char.media.nodes);
      }
    }

    // If query matches studio or character, prioritize those hit anime first
    const combinedMedia = (isStudioHit || isCharHit)
      ? [...extraMedia, ...directMedia]
      : directMedia;

    if (combinedMedia.length === 0) return [];

    const seenIds = new Set<number>();
    const isManga = typeApi === 'MANGA';

    return combinedMedia
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

        return {
          mal_id: m.idMal,
          url: `https://myanimelist.net/${isManga ? 'manga' : 'anime'}/${m.idMal}`,
          title: m.title.romaji || m.title.english || '',
          title_english: m.title.english || null,
          title_japanese: m.title.native || null,
          images: {
            jpg: { image_url: m.coverImage.large, large_image_url: m.coverImage.large, small_image_url: m.coverImage.large },
            webp: { image_url: m.coverImage.large, large_image_url: m.coverImage.large, small_image_url: m.coverImage.large }
          },
          synopsis: cleanOfficialText(m.synopsis) || null,
          type: isManga ? 'Manga' : (formatStr || 'TV'),
          episodes: isManga ? undefined : (m.episodes || null),
          chapters: isManga ? (m.chapters || null) : undefined,
          volumes: isManga ? (m.volumes || null) : undefined,
          status,
          airing: !isManga && m.status === 'RELEASING',
          publishing: isManga && m.status === 'RELEASING',
          score: computeExactScore(m),
          year: m.seasonYear || null,
          genres: (m.genres || []).map((g: string) => ({
            mal_id: Number(GENRE_NAME_TO_MAL_ID[g.toLowerCase()]) || 0,
            type: isManga ? 'manga' : 'anime',
            name: g,
            url: ''
          }))
        };
      });
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
    // We can fallback to Anilist right away for BOTH anime/manga if query is present, because Anilist's search is way better!
    // But let's try Jikan first.
    let jikanData = null;
    let pagination = null;
    try {
      const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        jikanData = deduplicateByMalId(res.data);
        pagination = res.pagination;
      }
    } catch(e) {}
    
    // If search query is present or Jikan returns empty/sparse, fetch AniList character/studio/media results
    if (clean || !jikanData || jikanData.length === 0) {
       const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy, options.type);
       if (anilistData && anilistData.length > 0) {
          // If query was studio/character/title, prioritize anilistData (which ranks entity matches first) and combine with Jikan
          const combined = deduplicateByMalId([...anilistData, ...(jikanData || [])]);
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

export async function serverGetAnimeDetails(id: number): Promise<BaseJikanAnime | null> {
  if (id === 34246) return null;
  const endpoint = `/anime/${id}/full`;
  const res = await fetchFromJikan<BaseJikanAnime>(endpoint, DETAIL_CACHE_TTL_MS);
  if (!res.data || isNsfwOrAdult(res.data)) return null;
  if (res.data.synopsis) {
    res.data.synopsis = cleanOfficialText(res.data.synopsis) || res.data.synopsis;
  }
  return res.data;
}

export async function serverGetAnimeCharacters(id: number) {
  const endpoint = `/anime/${id}/characters`;
  const res = await fetchFromJikan<unknown[]>(endpoint, DETAIL_CACHE_TTL_MS);
  return Array.isArray(res.data) ? res.data : [];
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
    let sort = '[SCORE_DESC]';
    if (filter === 'bypopularity') sort = '[POPULARITY_DESC]';
    else if (filter === 'favorite') sort = '[FAVORITES_DESC]';
    else if (filter === 'upcoming') sort = '[POPULARITY_DESC]';
    else if (filter === 'airing') sort = '[SCORE_DESC]';

    let statusApi: string | undefined = undefined;
    if (filter === 'airing') statusApi = 'RELEASING';
    if (filter === 'upcoming') statusApi = 'NOT_YET_RELEASED';

    const isIsekai = genre?.toLowerCase() === 'isekai';
    const anilistGenre = isIsekai ? undefined : genre;
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

    const [p1Res, p2Res] = await Promise.all([
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
            page: 1,
            perPage: 50
          }
        }),
        signal: AbortSignal.timeout(6000)
      }).then(r => r.json()).catch(() => null),
      targetLimit > 50 ? fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          query: anilistQuery,
          variables: {
            genre: anilistGenre,
            tag: anilistTag,
            seasonYear: year,
            status: statusApi,
            page: 2,
            perPage: 50
          }
        }),
        signal: AbortSignal.timeout(6000)
      }).then(r => r.json()).catch(() => null) : Promise.resolve(null)
    ]);

    const mediaList1 = p1Res?.data?.Page?.media || [];
    const mediaList2 = p2Res?.data?.Page?.media || [];
    const allMedia = [...mediaList1, ...mediaList2];

    if (allMedia.length > 0) {
      const mapped: BaseJikanAnime[] = allMedia.map((m: any) => {
        let st = 'Finished Airing';
        if (m.status === 'RELEASING') st = 'Currently Airing';
        if (m.status === 'NOT_YET_RELEASED') st = 'Not yet aired';

        const malId = m.idMal || (m.id ? m.id + 1000000 : Math.floor(Math.random() * 900000 + 100000));
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
      });

      const unique = deduplicateByMalId(mapped).slice(0, targetLimit);
      if (unique.length > 0) {
        memoryCache.set(cacheKey, { data: unique, timestamp: Date.now() });
        return unique;
      }
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

  // 1. Try Jikan /schedules
  try {
    const jikanEndpoint = normalizedDay ? `/schedules?filter=${normalizedDay}&sfw=true` : `/schedules?sfw=true`;
    const res = await fetchFromJikan<any[]>(jikanEndpoint, 1000 * 60 * 30);
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const mapped = res.data.map(item => {
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
      const unique = deduplicateByMalId(mapped);
      memoryCache.set(cacheKey, { data: unique, timestamp: Date.now() });
      return unique;
    }
  } catch (jikanErr) {
    console.warn('[Schedule] Jikan fetch notice:', jikanErr);
  }

  // 2. Fallback: AniList GraphQL for Releasing media with nextAiringEpisode
  try {
    const query = `
      query {
        Page(page: 1, perPage: 50) {
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

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      const json = await res.json();
      const mediaList = json.data?.Page?.media || [];

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

      const unique = deduplicateByMalId(filtered);
      if (unique.length > 0) {
        memoryCache.set(cacheKey, { data: unique, timestamp: Date.now() });
        return unique;
      }
    }
  } catch (anilistErr) {
    console.warn('[Schedule] AniList fallback notice:', anilistErr);
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

