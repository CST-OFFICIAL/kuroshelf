// Server-side Jikan Service Layer
// All communication with Jikan REST API occurs here with proper throttling, caching, User-Agent, and error recovery.

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

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
  status?: string;
  aired?: { string?: string };
  synopsis?: string | null;
  genres?: { mal_id: number; name: string }[];
  themes?: { mal_id: number; name: string }[];
  studios?: { mal_id: number; name: string }[];
  [key: string]: unknown;
}

import { INITIAL_REAL_JIKAN_ANIME } from './seedCatalog';

// In-memory cache for server
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const serverCache = new Map<string, CacheEntry<unknown>>();
const SEARCH_CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes for searches
const CATALOG_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour for top/seasonal catalogs

// Master index of real anime data fetched from Jikan to provide resilient search & details
const knownAnimeMap = new Map<number, BaseJikanAnime>();

export function indexAnimeItems(items: BaseJikanAnime[]) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item && typeof item.mal_id === 'number') {
      knownAnimeMap.set(item.mal_id, {
        ...(knownAnimeMap.get(item.mal_id) || {}),
        ...item,
      });
    }
  }
}

// Pre-populate with verified real Jikan anime records
indexAnimeItems(INITIAL_REAL_JIKAN_ANIME);

// Strict FIFO queue for throttling outgoing requests to Jikan (never deadlocks on errors)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 400; // 2.5 req/sec (safely below Jikan's 3 req/sec limit)
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

export async function fetchFromJikan<T>(endpoint: string, ttlMs: number = CATALOG_CACHE_TTL_MS): Promise<T | null> {
  const cacheKey = endpoint;
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  try {
    const isSearchEndpoint = endpoint.includes('?q=');
    const data = await enqueueJikanRequest(async () => {
      const maxRetries = isSearchEndpoint ? 0 : 2;
      let attempts = 0;

      while (attempts <= maxRetries) {
        attempts++;
        try {
          const res = await fetch(`${JIKAN_BASE_URL}${endpoint}`, {
            headers: {
              'User-Agent': 'KuroShelf/1.0 (https://kuroshelf.app)',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(4000),
          });

          if (res.status === 429) {
            console.warn(`[Jikan Server] Rate limited (429) on ${endpoint}. Waiting before retry ${attempts}/${maxRetries}...`);
            if (isSearchEndpoint) break;
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempts));
            continue;
          }

          if (res.status === 504 || res.status === 502 || res.status === 503) {
            console.warn(`[Jikan Server] Upstream gateway status (${res.status}) on ${endpoint}. Falling back without blocking.`);
            break; // Don't hang on down upstream; fall back cleanly
          }

          if (!res.ok) {
            throw new Error(`Jikan HTTP error ${res.status}: ${res.statusText}`);
          }

          const json = await res.json();
          // Verify body error format from Jikan
          if (json.status && json.status >= 400) {
            throw new Error(`Jikan status body error ${json.status}: ${json.message || ''}`);
          }

          return json.data as T;
        } catch (err) {
          if (attempts > maxRetries) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
      throw new Error(`Jikan failed after ${maxRetries} retries for ${endpoint}`);
    });

    if (data !== undefined && data !== null) {
      serverCache.set(cacheKey, { data, timestamp: Date.now() });
      if (Array.isArray(data)) {
        indexAnimeItems(data as BaseJikanAnime[]);
      } else if (typeof data === 'object' && 'mal_id' in (data as Record<string, unknown>)) {
        indexAnimeItems([data as BaseJikanAnime]);
      }
    }
    return data;
  } catch (err) {
    console.warn(`[Jikan Server Notice] Endpoint ${endpoint} failed:`, err instanceof Error ? err.message : err);
    // Return stale cache if available
    if (cached) {
      console.warn(`[Jikan Server Notice] Serving stale cache for ${endpoint}`);
      return cached.data as T;
    }
    return null;
  }
}

// Server API Methods

export async function serverSearchAnime(query: string, limit: number = 24): Promise<BaseJikanAnime[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return serverGetTopAnime('bypopularity', limit);
  }

  const encoded = encodeURIComponent(query.trim());
  const jikanEndpoint = `/anime?q=${encoded}&sfw=true&limit=${limit}`;

  // 1. Attempt real Jikan query
  const data = await fetchFromJikan<BaseJikanAnime[]>(jikanEndpoint, SEARCH_CACHE_TTL_MS);
  if (Array.isArray(data) && data.length > 0) {
    const items = deduplicateByMalId(data);
    indexAnimeItems(items);
    return items.slice(0, limit);
  }

  // 2. Resilient fallback: search through all real indexed Jikan anime in server memory
  if (knownAnimeMap.size > 0) {
    const allKnown = Array.from(knownAnimeMap.values());
    const matches = allKnown.filter((anime) => {
      if (!anime) return false;
      const title = anime.title?.toLowerCase() || '';
      const enTitle = anime.title_english?.toLowerCase() || '';
      const jaTitle = anime.title_japanese?.toLowerCase() || '';
      const syns = Array.isArray(anime.title_synonyms)
        ? anime.title_synonyms.map((s) => s.toLowerCase()).join(' ')
        : '';
      const genres = Array.isArray(anime.genres)
        ? anime.genres.map((g) => g.name.toLowerCase()).join(' ')
        : '';
      const studios = Array.isArray(anime.studios)
        ? anime.studios.map((s) => s.name.toLowerCase()).join(' ')
        : '';

      return (
        title.includes(cleanQuery) ||
        enTitle.includes(cleanQuery) ||
        jaTitle.includes(cleanQuery) ||
        syns.includes(cleanQuery) ||
        genres.includes(cleanQuery) ||
        studios.includes(cleanQuery)
      );
    });

    if (matches.length > 0) {
      // Sort by relevance: title startsWith > title includes > score
      matches.sort((a, b) => {
        const aTitle = a.title?.toLowerCase() || '';
        const bTitle = b.title?.toLowerCase() || '';
        const aStarts = aTitle.startsWith(cleanQuery);
        const bStarts = bTitle.startsWith(cleanQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return (b.score || 0) - (a.score || 0);
      });
      return matches.slice(0, limit);
    }
  }

  return [];
}

export async function serverGetTopAnime(filter: string = 'bypopularity', limit: number = 20): Promise<BaseJikanAnime[]> {
  if (filter === 'airing') {
    const seasonal = await serverGetSeasonalAnime(limit);
    if (seasonal.length > 0) return seasonal;
  }
  if (filter === 'upcoming') {
    const upcoming = await serverGetUpcomingAnime(limit);
    if (upcoming.length > 0) return upcoming;
  }

  const data = await fetchFromJikan<BaseJikanAnime[]>('/top/anime', CATALOG_CACHE_TTL_MS);
  let items = Array.isArray(data) ? deduplicateByMalId(data) : [];
  if (items.length === 0) {
    items = INITIAL_REAL_JIKAN_ANIME;
    serverCache.set('/top/anime', { data: items, timestamp: Date.now() });
  }
  indexAnimeItems(items);
  return items.slice(0, limit);
}

export async function serverGetSeasonalAnime(limit: number = 20): Promise<BaseJikanAnime[]> {
  const data = await fetchFromJikan<BaseJikanAnime[]>('/seasons/now', CATALOG_CACHE_TTL_MS);
  let items = Array.isArray(data) ? deduplicateByMalId(data) : [];
  if (items.length === 0) {
    items = INITIAL_REAL_JIKAN_ANIME.slice(0, limit);
    serverCache.set('/seasons/now', { data: items, timestamp: Date.now() });
  }
  indexAnimeItems(items);
  return items.slice(0, limit);
}

export async function serverGetUpcomingAnime(limit: number = 20): Promise<BaseJikanAnime[]> {
  const data = await fetchFromJikan<BaseJikanAnime[]>('/seasons/upcoming', CATALOG_CACHE_TTL_MS);
  let items = Array.isArray(data) ? deduplicateByMalId(data) : [];
  if (items.length === 0) {
    items = INITIAL_REAL_JIKAN_ANIME.slice(0, limit);
    serverCache.set('/seasons/upcoming', { data: items, timestamp: Date.now() });
  }
  indexAnimeItems(items);
  return items.slice(0, limit);
}

export async function serverGetAnimeDetails(id: number) {
  const data = await fetchFromJikan<BaseJikanAnime>(`/anime/${id}/full`, CATALOG_CACHE_TTL_MS);
  if (data) {
    indexAnimeItems([data]);
    return data;
  }
  return knownAnimeMap.get(id) || null;
}

export async function serverGetAnimeCharacters(id: number) {
  const data = await fetchFromJikan(`/anime/${id}/characters`, CATALOG_CACHE_TTL_MS);
  return Array.isArray(data) ? data : [];
}

export async function serverGetTopManga(limit: number = 20) {
  const data = await fetchFromJikan<{ mal_id: number }[]>('/top/manga', CATALOG_CACHE_TTL_MS);
  const items = Array.isArray(data) ? deduplicateByMalId(data) : [];
  return items.slice(0, limit);
}

export async function serverSearchManga(query: string, limit: number = 20) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return serverGetTopManga(limit);
  }
  const encoded = encodeURIComponent(cleanQuery);
  const data = await fetchFromJikan<{ mal_id: number }[]>(`/manga?q=${encoded}`, SEARCH_CACHE_TTL_MS);
  const items = Array.isArray(data) ? deduplicateByMalId(data) : [];
  return items.slice(0, limit);
}

// Pre-warm the catalog asynchronously on server boot
export function warmUpCatalog() {
  setTimeout(async () => {
    try {
      console.log('[Catalog Warmup] Pre-fetching top anime and seasonal catalogs...');
      await serverGetTopAnime('bypopularity', 25);
      await serverGetSeasonalAnime(25);
      await serverGetUpcomingAnime(25);
      console.log(`[Catalog Warmup] Indexed ${knownAnimeMap.size} titles in server catalog.`);
    } catch (err) {
      console.warn('[Catalog Warmup] Notice during initial warmup:', err);
    }
  }, 1000);
}
