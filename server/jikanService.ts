// Server-side Jikan Service Layer
// Handles communication with Jikan REST API with throttling, database caching, stale-while-revalidate,
// and resilient fallbacks when upstream MyAnimeList/Jikan experiences 504 Gateway Timeouts or network issues.

import { db } from './db';
import {
  SEED_POPULAR_ANIME,
  SEED_AIRING_ANIME,
  SEED_UPCOMING_ANIME,
  SEED_GENRES,
  SEED_TOP_MANGA,
} from './catalogSeed';

const JIKAN_BASE_URL =
  process.env.JIKAN_API_BASE_URL ||
  process.env.VITE_JIKAN_API_BASE_URL ||
  'https://api.jikan.moe/v4';

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
function getDbCache<T>(cacheKey: string, allowStale: boolean = false): { data: T; pagination?: JikanPagination } | null {
  try {
    const row = db.prepare('SELECT data_json, expires_at FROM anime_cache WHERE cache_key = ?').get(cacheKey) as
      | { data_json: string; expires_at: number }
      | undefined;
    if (!row) return null;
    if (row.expires_at < Date.now() && !allowStale) {
      return null;
    }
    const parsed = JSON.parse(row.data_json);
    return parsed;
  } catch {
    return null;
  }
}

// Database cache write
function setDbCache<T>(cacheKey: string, data: T, pagination: JikanPagination | undefined, ttlMs: number) {
  try {
    const expiresAt = Date.now() + ttlMs;
    const payload = JSON.stringify({ data, pagination });
    db.prepare(`
      INSERT INTO anime_cache (cache_key, data_json, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET data_json = excluded.data_json, expires_at = excluded.expires_at
    `).run(cacheKey, payload, expiresAt);
  } catch {
    // Non-fatal cache failure
  }
}

function deduplicateByMalId<T extends { mal_id: number }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<number>();
  return items.filter((item) => {
    if (!item || typeof item.mal_id !== 'number' || seen.has(item.mal_id)) {
      return false;
    }
    seen.add(item.mal_id);
    return true;
  });
}

// Resilient Catalog Fallbacks for when Jikan is down or returns 504 Gateway Timeout
function getCatalogSeedFallback<T>(endpoint: string): { data: T; pagination?: JikanPagination } | null {
  const url = new URL(endpoint, 'http://localhost');
  const path = url.pathname;
  const filter = url.searchParams.get('filter');
  const limit = Math.max(Number(url.searchParams.get('limit')) || 24, 1);
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);

  const paginate = <I>(items: I[]): { data: I[]; pagination: JikanPagination } => {
    const start = (page - 1) * limit;
    const sliced = items.slice(start, start + limit);
    return {
      data: sliced,
      pagination: {
        last_visible_page: Math.ceil(items.length / limit) || 1,
        has_next_page: start + limit < items.length,
        current_page: page,
        items: {
          count: sliced.length,
          total: items.length,
          per_page: limit,
        },
      },
    };
  };

  if (path === '/top/anime') {
    if (filter === 'airing') {
      return paginate(SEED_AIRING_ANIME) as unknown as { data: T; pagination?: JikanPagination };
    }
    if (filter === 'upcoming') {
      return paginate(SEED_UPCOMING_ANIME) as unknown as { data: T; pagination?: JikanPagination };
    }
    return paginate(SEED_POPULAR_ANIME) as unknown as { data: T; pagination?: JikanPagination };
  }

  if (path === '/seasons/now') {
    return paginate(SEED_AIRING_ANIME) as unknown as { data: T; pagination?: JikanPagination };
  }

  if (path === '/seasons/upcoming') {
    return paginate(SEED_UPCOMING_ANIME) as unknown as { data: T; pagination?: JikanPagination };
  }

  if (path === '/genres/anime') {
    return { data: SEED_GENRES as unknown as T };
  }

  if (path === '/top/manga' || path.startsWith('/manga')) {
    return paginate(SEED_TOP_MANGA) as unknown as { data: T; pagination?: JikanPagination };
  }

  // Check detail match /anime/{id}
  const detailMatch = path.match(/\/anime\/(\d+)/);
  if (detailMatch) {
    const id = Number(detailMatch[1]);
    const all = [...SEED_POPULAR_ANIME, ...SEED_AIRING_ANIME, ...SEED_UPCOMING_ANIME];
    const found = all.find((a) => a.mal_id === id);
    if (found) {
      return { data: found as unknown as T };
    }
  }

  return null;
}

// Seed the local SQLite database on startup with authentic catalog data
export function initCatalogSeed() {
  try {
    const insertAnime = db.prepare(`
      INSERT INTO anime (mal_id, title, title_english, title_japanese, image_url, score, status, episodes, synopsis, genres, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(mal_id) DO UPDATE SET
        title = excluded.title,
        score = excluded.score,
        status = excluded.status,
        episodes = excluded.episodes,
        synopsis = excluded.synopsis,
        genres = excluded.genres,
        updated_at = datetime('now')
    `);

    const all = [...SEED_POPULAR_ANIME, ...SEED_AIRING_ANIME, ...SEED_UPCOMING_ANIME];
    for (const item of all) {
      insertAnime.run(
        item.mal_id,
        item.title,
        item.title_english || null,
        item.title_japanese || null,
        item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
        item.score || null,
        item.status || null,
        item.episodes || null,
        item.synopsis || null,
        JSON.stringify(item.genres || [])
      );
    }

    // Pre-populate anime_cache for primary catalog endpoints if not present
    const checkCache = db.prepare('SELECT COUNT(*) as cnt FROM anime_cache WHERE cache_key = ?');

    const seedCacheKeys = [
      { key: '/top/anime?filter=bypopularity&page=1&limit=12', data: SEED_POPULAR_ANIME.slice(0, 12) },
      { key: '/top/anime?filter=bypopularity&page=1&limit=24', data: SEED_POPULAR_ANIME },
      { key: '/top/anime?filter=airing&page=1&limit=12', data: SEED_AIRING_ANIME.slice(0, 12) },
      { key: '/top/anime?filter=airing&page=1&limit=24', data: SEED_AIRING_ANIME },
      { key: '/seasons/now?page=1&limit=12', data: SEED_AIRING_ANIME.slice(0, 12) },
      { key: '/seasons/now?page=1&limit=24', data: SEED_AIRING_ANIME },
      { key: '/seasons/upcoming?page=1&limit=12', data: SEED_UPCOMING_ANIME.slice(0, 12) },
      { key: '/seasons/upcoming?page=1&limit=24', data: SEED_UPCOMING_ANIME },
      { key: '/genres/anime', data: SEED_GENRES },
      { key: '/top/manga?page=1&limit=12', data: SEED_TOP_MANGA },
      { key: '/top/manga?page=1&limit=24', data: SEED_TOP_MANGA },
    ];

    for (const entry of seedCacheKeys) {
      const exists = checkCache.get(entry.key) as { cnt: number } | undefined;
      if (!exists || exists.cnt === 0) {
        setDbCache(
          entry.key,
          entry.data,
          {
            last_visible_page: 1,
            has_next_page: false,
            current_page: 1,
            items: { count: entry.data.length, total: entry.data.length, per_page: entry.data.length },
          },
          CATALOG_CACHE_TTL_MS * 24 // 48 hours baseline
        );
      }
    }
  } catch (err) {
    console.debug('[Catalog Seed] Notice:', err);
  }
}

// Auto-run seed initialization
initCatalogSeed();

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
      const isSearch = endpoint.includes('?q=') || endpoint.includes('&q=');
      const maxRetries = isSearch ? 1 : 2;
      let attempts = 0;

      while (attempts <= maxRetries) {
        attempts++;
        try {
          const url = `${JIKAN_BASE_URL}${endpoint}`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'KuroShelf/1.0 (+https://kuroshelf.app)',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(7000),
          });

          if (res.status === 429) {
            // Upstream Jikan rate limit: wait and retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
            continue;
          }

          if (res.status === 504 || res.status === 502 || res.status === 503) {
            // Upstream gateway error (e.g. MyAnimeList is timing out for Jikan)
            // Exit loop quietly so stale/seed fallback takes over seamlessly
            break;
          }

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
        } catch {
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
  } catch {
    // Network or queue failure: continue to resilient fallback
  }

  // 4. Stale-while-revalidate fallback: retrieve any existing DB cache (even if expired)
  const staleDb = getDbCache<T>(cacheKey, true);
  if (staleDb && staleDb.data) {
    memoryCache.set(cacheKey, { data: staleDb.data, pagination: staleDb.pagination, timestamp: Date.now() });
    return staleDb;
  }

  // 5. Seed Catalog Fallback: authentic Jikan v4 structures for top/airing/seasonal/upcoming/genres
  const seedFallback = getCatalogSeedFallback<T>(endpoint);
  if (seedFallback) {
    memoryCache.set(cacheKey, { data: seedFallback.data, pagination: seedFallback.pagination, timestamp: Date.now() });
    setDbCache(cacheKey, seedFallback.data, seedFallback.pagination, ttlMs);
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

export async function serverSearchAnime(options: SearchAnimeOptions): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);

  const clean = options.query?.trim() || '';

  const params = new URLSearchParams();
  if (clean) params.set('q', clean);
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (options.type && options.type !== 'all') params.set('type', options.type);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.genres && options.genres !== 'all') params.set('genres', options.genres);
  if (options.orderBy) params.set('order_by', options.orderBy);
  if (options.sort) params.set('sort', options.sort);

  const endpoint = `/anime?${params.toString()}`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);

  if (res.data && Array.isArray(res.data) && res.data.length > 0) {
    return {
      data: deduplicateByMalId(res.data),
      pagination: res.pagination,
    };
  }

  // Fallback: If Jikan search returned empty or 504 timed out, search local SQLite anime catalog!
  if (clean) {
    try {
      const rows = db.prepare(`
        SELECT * FROM anime
        WHERE title LIKE ? OR title_english LIKE ? OR title_japanese LIKE ? OR synopsis LIKE ?
        LIMIT ?
      `).all(`%${clean}%`, `%${clean}%`, `%${clean}%`, `%${clean}%`, limit) as Array<{
        mal_id: number;
        title: string;
        title_english: string | null;
        title_japanese: string | null;
        image_url: string | null;
        score: number | null;
        status: string | null;
        episodes: number | null;
        synopsis: string | null;
        genres: string | null;
      }>;

      if (rows.length > 0) {
        const localResults: BaseJikanAnime[] = rows.map((r) => ({
          mal_id: r.mal_id,
          title: r.title,
          title_english: r.title_english,
          title_japanese: r.title_japanese,
          images: {
            jpg: {
              image_url: r.image_url || 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
              large_image_url: r.image_url || 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
            },
          },
          score: r.score,
          status: r.status || 'Finished Airing',
          episodes: r.episodes,
          synopsis: r.synopsis,
          genres: r.genres ? JSON.parse(r.genres) : [],
        }));
        return {
          data: localResults,
          pagination: {
            last_visible_page: 1,
            has_next_page: false,
            current_page: 1,
            items: { count: localResults.length, total: localResults.length, per_page: limit },
          },
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function serverGetTopAnime(
  filter: string = 'bypopularity',
  page: number = 1,
  limit: number = 24
): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);

  const params = new URLSearchParams();
  params.set('page', String(safePage));
  params.set('limit', String(safeLimit));
  if (filter && filter !== 'all') {
    params.set('filter', filter);
  }

  const endpoint = `/top/anime?${params.toString()}`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, CATALOG_CACHE_TTL_MS);

  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function serverGetSeasonalAnime(
  page: number = 1,
  limit: number = 24
): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);

  const endpoint = `/seasons/now?page=${safePage}&limit=${safeLimit}`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, CATALOG_CACHE_TTL_MS);

  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function serverGetUpcomingAnime(
  page: number = 1,
  limit: number = 24
): Promise<{ data: BaseJikanAnime[]; pagination?: JikanPagination }> {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);

  const endpoint = `/seasons/upcoming?page=${safePage}&limit=${safeLimit}`;
  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, CATALOG_CACHE_TTL_MS);

  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function serverGetAnimeDetails(id: number): Promise<BaseJikanAnime | null> {
  const endpoint = `/anime/${id}/full`;
  const res = await fetchFromJikan<BaseJikanAnime>(endpoint, DETAIL_CACHE_TTL_MS);
  if (res.data) {
    // Store in sqlite anime table for relational referential integrity
    try {
      db.prepare(`
        INSERT INTO anime (mal_id, title, title_english, title_japanese, image_url, score, status, episodes, synopsis, genres, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(mal_id) DO UPDATE SET
          title = excluded.title,
          score = excluded.score,
          status = excluded.status,
          episodes = excluded.episodes,
          synopsis = excluded.synopsis,
          genres = excluded.genres,
          updated_at = datetime('now')
      `).run(
        res.data.mal_id,
        res.data.title,
        res.data.title_english || null,
        res.data.title_japanese || null,
        res.data.images?.jpg?.large_image_url || res.data.images?.jpg?.image_url || null,
        res.data.score || null,
        res.data.status || null,
        res.data.episodes || null,
        res.data.synopsis || null,
        JSON.stringify(res.data.genres || [])
      );
    } catch {
      // Non-fatal sync
    }
    return res.data;
  }

  // Fallback: check if row exists in local SQLite anime table
  try {
    const row = db.prepare('SELECT * FROM anime WHERE mal_id = ?').get(id) as {
      mal_id: number;
      title: string;
      title_english: string | null;
      title_japanese: string | null;
      image_url: string | null;
      score: number | null;
      status: string | null;
      episodes: number | null;
      synopsis: string | null;
      genres: string | null;
    } | undefined;

    if (row) {
      return {
        mal_id: row.mal_id,
        title: row.title,
        title_english: row.title_english,
        title_japanese: row.title_japanese,
        images: {
          jpg: {
            image_url: row.image_url || 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
            large_image_url: row.image_url || 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
          },
        },
        score: row.score,
        status: row.status || 'Finished Airing',
        episodes: row.episodes,
        synopsis: row.synopsis,
        genres: row.genres ? JSON.parse(row.genres) : [],
      };
    }
  } catch {
    // Non-fatal
  }

  return null;
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
  const res = await fetchFromJikan<unknown[]>(endpoint, CATALOG_CACHE_TTL_MS);
  return {
    data: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination,
  };
}

export async function serverSearchManga(query: string, page: number = 1, limit: number = 24) {
  const clean = query.trim();
  if (!clean) return serverGetTopManga(page, limit);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);
  const endpoint = `/manga?q=${encodeURIComponent(clean)}&page=${safePage}&limit=${safeLimit}`;
  const res = await fetchFromJikan<unknown[]>(endpoint, SEARCH_CACHE_TTL_MS);
  return {
    data: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination,
  };
}
