import { AnimeItem, MangaItem, CharacterItem, JikanGenre } from '../types';

// In-memory cache to avoid duplicate calls during session
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

// Persistent cache in localStorage for resilience across sessions/outages
const PERSISTENT_CACHE_PREFIX = 'kuroshelf_data_';

function getStoredCache<T>(key: string, allowStale: boolean = false): T | null {
  // 1. Check memory cache
  const mem = memoryCache.get(key);
  if (mem && (allowStale || Date.now() - mem.timestamp < CACHE_TTL_MS)) {
    return mem.data as T;
  }

  // 2. Check localStorage / sessionStorage
  try {
    const raw = localStorage.getItem(PERSISTENT_CACHE_PREFIX + key) || sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (allowStale || Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache.set(key, parsed);
        return parsed.data as T;
      }
    }
  } catch {
    // Storage access fallback
  }
  return null;
}

function saveToCache(key: string, data: unknown) {
  const payload = { data, timestamp: Date.now() };
  memoryCache.set(key, payload);
  try {
    localStorage.setItem(PERSISTENT_CACHE_PREFIX + key, JSON.stringify(payload));
  } catch {
    try {
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Quota exceeded
    }
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

// Client service calling our internal server API layer
async function fetchFromApi<T>(endpoint: string, fallbackData?: T): Promise<T> {
  const cacheKey = endpoint;

  const cached = getStoredCache<T>(cacheKey, false);
  if (cached !== null) {
    return cached;
  }

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const json = await res.json();
    const data = (json.data ?? fallbackData) as T;
    saveToCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn(`[Client Service Notice] Endpoint ${endpoint} failed, falling back to local cache:`, err);
    const stale = getStoredCache<T>(cacheKey, true);
    if (stale !== null) return stale;
    if (fallbackData !== undefined) return fallbackData;
    throw err;
  }
}

// Service Methods
export async function getTopAnime(
  filter: 'airing' | 'bypopularity' | 'favorite' | 'upcoming' = 'bypopularity',
  limit: number = 20
): Promise<AnimeItem[]> {
  try {
    const data = await fetchFromApi<AnimeItem[]>(`/api/anime/top?filter=${filter}&limit=${limit}`, []);
    const unique = deduplicateByMalId(Array.isArray(data) ? data : []);
    return unique.slice(0, limit);
  } catch (err) {
    console.warn('Failed to fetch top anime:', err);
    return [];
  }
}

export async function getSeasonalAnime(limit: number = 20): Promise<AnimeItem[]> {
  const data = await fetchFromApi<AnimeItem[]>(`/api/anime/seasonal?limit=${limit}`, []);
  const unique = deduplicateByMalId(Array.isArray(data) ? data : []);
  return unique.slice(0, limit);
}

export async function getUpcomingAnime(limit: number = 20): Promise<AnimeItem[]> {
  const data = await fetchFromApi<AnimeItem[]>(`/api/anime/upcoming?limit=${limit}`, []);
  const unique = deduplicateByMalId(Array.isArray(data) ? data : []);
  return unique.slice(0, limit);
}

export async function searchAnime(query: string, limit: number = 24): Promise<AnimeItem[]> {
  const clean = query.trim();
  if (!clean) {
    return getTopAnime('bypopularity', limit);
  }
  const encoded = encodeURIComponent(clean);
  const data = await fetchFromApi<AnimeItem[]>(`/api/anime/search?q=${encoded}&limit=${limit}`, []);
  const unique = deduplicateByMalId(Array.isArray(data) ? data : []);
  return unique.slice(0, limit);
}

export async function getTopManga(limit: number = 20): Promise<MangaItem[]> {
  const data = await fetchFromApi<MangaItem[]>(`/api/manga/top?limit=${limit}`, []);
  const unique = deduplicateByMalId(Array.isArray(data) ? data : []);
  return unique.slice(0, limit);
}

export async function searchManga(query: string, limit: number = 20): Promise<MangaItem[]> {
  const clean = query.trim();
  if (!clean) {
    return getTopManga(limit);
  }
  const encoded = encodeURIComponent(clean);
  const data = await fetchFromApi<MangaItem[]>(`/api/manga/search?q=${encoded}&limit=${limit}`, []);
  const unique = deduplicateByMalId(Array.isArray(data) ? data : []);
  return unique.slice(0, limit);
}

export async function getAnimeById(id: number): Promise<AnimeItem | null> {
  return fetchFromApi<AnimeItem | null>(`/api/anime/${id}`, null);
}

export async function getAnimeCharacters(id: number): Promise<CharacterItem[]> {
  const data = await fetchFromApi<CharacterItem[]>(`/api/anime/${id}/characters`, []);
  return Array.isArray(data) ? data : [];
}

export async function getAnimeGenres(): Promise<JikanGenre[]> {
  return [];
}
