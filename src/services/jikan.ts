import { AnimeItem, MangaItem, CharacterItem, JikanGenre, JikanPagination } from '../types';

// In-memory cache to avoid duplicate calls during session
const memoryCache = new Map<string, { data: unknown; pagination?: JikanPagination; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

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

async function fetchFromApi<T>(
  endpoint: string,
  fallbackData?: T
): Promise<{ data: T; pagination?: JikanPagination }> {
  const cacheKey = endpoint;
  const mem = memoryCache.get(cacheKey);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return { data: mem.data as T, pagination: mem.pagination };
  }

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const json = await res.json();
    const data = (json.data ?? fallbackData) as T;
    const pagination = json.pagination as JikanPagination | undefined;
    memoryCache.set(cacheKey, { data, pagination, timestamp: Date.now() });
    return { data, pagination };
  } catch (err) {
    console.warn(`[Client Service] Endpoint ${endpoint} failed:`, err);
    if (mem) {
      return { data: mem.data as T, pagination: mem.pagination };
    }
    if (fallbackData !== undefined) {
      return { data: fallbackData };
    }
    throw err;
  }
}

export interface SearchOptions {
  query?: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  genres?: string;
  orderBy?: string;
  sort?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination?: JikanPagination;
}

export async function searchAnime(
  queryOrOptions: string | SearchOptions,
  limit: number = 24
): Promise<AnimeItem[]> {
  const options: SearchOptions = typeof queryOrOptions === 'string'
    ? { query: queryOrOptions, limit }
    : queryOrOptions;

  const result = await searchAnimePaginated(options);
  return result.data;
}

export async function searchAnimePaginated(
  options: SearchOptions
): Promise<PaginatedResult<AnimeItem>> {
  const params = new URLSearchParams();
  if (options.query?.trim()) params.set('q', options.query.trim());
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.type && options.type !== 'all') params.set('type', options.type);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.genres && options.genres !== 'all') params.set('genres', options.genres);
  if (options.orderBy) params.set('order_by', options.orderBy);
  if (options.sort) params.set('sort', options.sort);

  const endpoint = `/api/anime/search?${params.toString()}`;
  const res = await fetchFromApi<AnimeItem[]>(endpoint, []);
  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function getTopAnime(
  filter: 'airing' | 'bypopularity' | 'favorite' | 'upcoming' | 'top100' = 'bypopularity',
  limit: number = 20,
  page: number = 1,
  genre?: string,
  year?: string
): Promise<AnimeItem[]> {
  
  if (filter === 'top100') {
    let url = '/api/anime/top100';
    if (genre && genre !== 'all' || (year && year !== 'all')) {
      const params = new URLSearchParams();
      if (genre && genre !== 'all') params.set('genre', genre);
      if (year && year !== 'all') params.set('year', year);
      url += '?' + params.toString();
    }
    const res = await fetchFromApi<AnimeItem[]>(url, []);
    return Array.isArray(res.data) ? res.data : [];
  }
  const res = await getTopAnimePaginated(filter, page, limit);

  return res.data;
}

export async function getTopAnimePaginated(
  filter: string = 'bypopularity',
  page: number = 1,
  limit: number = 24
): Promise<PaginatedResult<AnimeItem>> {
  const endpoint = `/api/anime/top?filter=${filter}&page=${page}&limit=${limit}`;
  const res = await fetchFromApi<AnimeItem[]>(endpoint, []);
  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function getSeasonalAnime(limit: number = 20, page: number = 1): Promise<AnimeItem[]> {
  const res = await getSeasonalAnimePaginated(page, limit);
  return res.data;
}

export async function getSeasonalAnimePaginated(
  page: number = 1,
  limit: number = 24
): Promise<PaginatedResult<AnimeItem>> {
  const endpoint = `/api/anime/seasonal?page=${page}&limit=${limit}`;
  const res = await fetchFromApi<AnimeItem[]>(endpoint, []);
  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function getUpcomingAnime(limit: number = 20, page: number = 1): Promise<AnimeItem[]> {
  const res = await getUpcomingAnimePaginated(page, limit);
  return res.data;
}

export async function getUpcomingAnimePaginated(
  page: number = 1,
  limit: number = 24
): Promise<PaginatedResult<AnimeItem>> {
  const endpoint = `/api/anime/upcoming?page=${page}&limit=${limit}`;
  const res = await fetchFromApi<AnimeItem[]>(endpoint, []);
  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
    pagination: res.pagination,
  };
}

export async function getAnimeById(id: number): Promise<AnimeItem | null> {
  const res = await fetchFromApi<AnimeItem | null>(`/api/anime/${id}`, null);
  return res.data;
}

export async function getAnimeCharacters(id: number): Promise<CharacterItem[]> {
  const res = await fetchFromApi<CharacterItem[]>(`/api/anime/${id}/characters`, []);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getAnimeGenres(): Promise<JikanGenre[]> {
  const res = await fetchFromApi<JikanGenre[]>('/api/anime/genres', []);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getTopManga(limit: number = 20, page: number = 1): Promise<MangaItem[]> {
  const res = await fetchFromApi<MangaItem[]>(`/api/manga/top?page=${page}&limit=${limit}`, []);
  return deduplicateByMalId(Array.isArray(res.data) ? res.data : []).slice(0, limit);
}

export async function searchManga(query: string, limit: number = 20, page: number = 1): Promise<MangaItem[]> {
  const clean = query.trim();
  if (!clean) return getTopManga(limit, page);
  const res = await fetchFromApi<MangaItem[]>(`/api/manga/search?q=${encodeURIComponent(clean)}&page=${page}&limit=${limit}`, []);
  return deduplicateByMalId(Array.isArray(res.data) ? res.data : []).slice(0, limit);
}
