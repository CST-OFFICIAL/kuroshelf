import {
  AnimeItem,
  MangaItem,
  CharacterItem,
  JikanGenre,
  JikanPagination,
  AiringScheduleItem,
  RecommendedAnimeItem,
  CharacterDetail,
  PersonDetail,
} from '../types';
import { fetchDirectJikan, isNsfwOrAdultClient } from './directJikanFallback';
import { fetchAniListAnimeList } from './anilistService';

// In-memory cache to avoid duplicate calls during session
const memoryCache = new Map<string, { data: unknown; pagination?: JikanPagination; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

function deduplicateByMalId<T extends { mal_id?: number; id?: string | number }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string | number>();
  return items.filter((item) => {
    if (!item || isNsfwOrAdultClient(item)) return false;
    const identifier = item.mal_id ?? item.id;
    if (!identifier || seen.has(identifier)) {
      return false;
    }
    seen.add(identifier);
    return true;
  });
}

/**
 * Universal requester:
 * 1. Attempts the internal backend endpoint (/api/...) first.
 * 2. If the backend is not present (e.g. Vercel static deployment) or returns 404/5xx,
 *    it seamlessly falls back to direct Jikan API query on the client side.
 *    This ensures the anime and manga library NEVER shows up blank or empty!
 */
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
    // If the server responded with OK and valid json
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        const data = (json.data ?? fallbackData) as T;
        const pagination = json.pagination as JikanPagination | undefined;
        // If the server succeeded but returned an empty array, null, or only the minimal seed items on list endpoints, trigger direct fallback
        const isListEndpoint = endpoint.includes('/api/anime/top') || endpoint.includes('/api/anime/search') || endpoint.includes('/api/anime/seasonal') || endpoint.includes('/api/anime/upcoming') || endpoint.includes('/api/manga');
        const hasMinimalSeedData = isListEndpoint && Array.isArray(data) && data.length <= 5 && !endpoint.includes('limit=5');
        if (!data || (Array.isArray(data) && data.length === 0) || hasMinimalSeedData) {
          const directResult = await routeToDirectJikan<T>(endpoint);
          if (directResult && directResult.data && (!Array.isArray(directResult.data) || directResult.data.length > 5)) {
            memoryCache.set(cacheKey, { data: directResult.data, pagination: directResult.pagination, timestamp: Date.now() });
            return directResult;
          }
        }
        memoryCache.set(cacheKey, { data, pagination, timestamp: Date.now() });
        return { data, pagination };
      }
    }
    // If 404 or HTML (Vercel SPA fallback), trigger the direct Jikan fallback
    throw new Error(`API error ${res.status}`);
  } catch (err) {
    // Attempt direct Jikan fallback based on endpoint mapping
    try {
      const directResult = await routeToDirectJikan<T>(endpoint);
      if (directResult) {
        memoryCache.set(cacheKey, { data: directResult.data, pagination: directResult.pagination, timestamp: Date.now() });
        return directResult;
      }
    } catch (fallbackErr) {
      console.warn(`[Client Direct Fallback] Failed for ${endpoint}:`, fallbackErr);
    }

    if (mem) {
      return { data: mem.data as T, pagination: mem.pagination };
    }
    if (fallbackData !== undefined) {
      return { data: fallbackData };
    }
    throw err;
  }
}

/**
 * Maps Kuro Shelf /api/* routes directly to public Jikan v4 endpoints
 */
async function routeToDirectJikan<T>(endpoint: string): Promise<{ data: T; pagination?: JikanPagination } | null> {
  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');

  // 1. /api/anime/seasonal
  if (path === '/api/anime/seasonal') {
    const page = Number(params.get('page')) || 1;
    const limit = Number(params.get('limit')) || 24;
    try {
      const res = await fetchDirectJikan<AnimeItem[]>(`/seasons/now?page=${page}&limit=${limit}`);
      if (res.data && res.data.length > 0) {
        return { data: res.data as unknown as T, pagination: res.pagination };
      }
    } catch (jikanErr) {
      console.warn('[Jikan Direct seasonal] Error, trying AniList...', jikanErr);
    }
    // AniList fallback for seasonal
    try {
      const anilistRes = await fetchAniListAnimeList({
        status: 'RELEASING',
        sort: 'POPULARITY_DESC',
        page,
        perPage: limit,
      });
      return { data: anilistRes.data as unknown as T, pagination: anilistRes.pagination };
    } catch (anilistErr) {
      console.warn('[AniList seasonal] Error:', anilistErr);
    }
  }

  // 2. /api/anime/upcoming
  if (path === '/api/anime/upcoming') {
    const page = Number(params.get('page')) || 1;
    const limit = Number(params.get('limit')) || 24;
    try {
      const res = await fetchDirectJikan<AnimeItem[]>(`/seasons/upcoming?page=${page}&limit=${limit}`);
      if (res.data && res.data.length > 0) {
        return { data: res.data as unknown as T, pagination: res.pagination };
      }
    } catch (jikanErr) {
      console.warn('[Jikan Direct upcoming] Error, trying AniList...', jikanErr);
    }
    // AniList fallback for upcoming
    try {
      const anilistRes = await fetchAniListAnimeList({
        status: 'NOT_YET_RELEASED',
        sort: 'POPULARITY_DESC',
        page,
        perPage: limit,
      });
      return { data: anilistRes.data as unknown as T, pagination: anilistRes.pagination };
    } catch (anilistErr) {
      console.warn('[AniList upcoming] Error:', anilistErr);
    }
  }

  // 3. /api/anime/top or /api/anime/top100
  if (path === '/api/anime/top' || path === '/api/anime/top100') {
    const filter = params.get('filter') || 'bypopularity';
    const page = Number(params.get('page')) || 1;
    const limit = Number(params.get('limit')) || 24;
    const genre = params.get('genre');
    const jikanParams = new URLSearchParams();
    jikanParams.set('page', String(page));
    jikanParams.set('limit', String(limit));

    if (filter === 'airing') jikanParams.set('filter', 'airing');
    else if (filter === 'upcoming') jikanParams.set('filter', 'upcoming');
    else if (filter === 'favorite') jikanParams.set('filter', 'favorite');
    else if (filter === 'bypopularity') jikanParams.set('filter', 'bypopularity');

    if (genre && genre !== 'all') jikanParams.set('genres', genre);

    try {
      const res = await fetchDirectJikan<AnimeItem[]>(`/top/anime?${jikanParams.toString()}`);
      if (res.data && res.data.length > 0) {
        return { data: res.data as unknown as T, pagination: res.pagination };
      }
    } catch (jikanErr) {
      console.warn('[Jikan Direct top] Error, trying AniList...', jikanErr);
    }

    // AniList fallback for top/popular/airing
    try {
      let anilistStatus: string | undefined;
      let anilistSort = 'SCORE_DESC';
      if (filter === 'airing') {
        anilistStatus = 'RELEASING';
        anilistSort = 'POPULARITY_DESC';
      } else if (filter === 'upcoming') {
        anilistStatus = 'NOT_YET_RELEASED';
        anilistSort = 'POPULARITY_DESC';
      } else if (filter === 'bypopularity' || filter === 'top100') {
        anilistSort = 'POPULARITY_DESC';
      } else if (filter === 'favorite') {
        anilistSort = 'FAVOURITES_DESC';
      }

      const anilistRes = await fetchAniListAnimeList({
        status: anilistStatus,
        sort: anilistSort,
        page,
        perPage: limit,
      });
      return { data: anilistRes.data as unknown as T, pagination: anilistRes.pagination };
    } catch (anilistErr) {
      console.warn('[AniList top] Error:', anilistErr);
    }
  }

  // 4. /api/anime/search
  if (path === '/api/anime/search') {
    const searchParams = new URLSearchParams();
    const q = params.get('q');
    const page = Number(params.get('page')) || 1;
    const limit = Number(params.get('limit')) || 24;
    if (q) searchParams.set('q', q);
    searchParams.set('page', String(page));
    searchParams.set('limit', String(limit));
    if (params.get('type') && params.get('type') !== 'all') searchParams.set('type', params.get('type')!);
    if (params.get('status') && params.get('status') !== 'all') searchParams.set('status', params.get('status')!);
    if (params.get('genres') && params.get('genres') !== 'all') searchParams.set('genres', params.get('genres')!);
    if (params.get('order_by')) searchParams.set('order_by', params.get('order_by')!);
    if (params.get('sort')) searchParams.set('sort', params.get('sort')!);

    // Safe default to sfw
    searchParams.set('sfw', 'true');
    try {
      const res = await fetchDirectJikan<AnimeItem[]>(`/anime?${searchParams.toString()}`);
      if (res.data && res.data.length > 0) {
        return { data: res.data as unknown as T, pagination: res.pagination };
      }
    } catch (jikanErr) {
      console.warn('[Jikan Direct search] Error, trying AniList...', jikanErr);
    }

    if (q || params.get('genres') || params.get('status') || params.get('type')) {
      try {
        let anilistStatus: string | undefined;
        const statusVal = params.get('status');
        if (statusVal === 'airing') anilistStatus = 'RELEASING';
        else if (statusVal === 'complete') anilistStatus = 'FINISHED';
        else if (statusVal === 'upcoming') anilistStatus = 'NOT_YET_RELEASED';

        const anilistRes = await fetchAniListAnimeList({
          search: q || undefined,
          status: anilistStatus,
          sort: q ? undefined : 'POPULARITY_DESC',
          page,
          perPage: limit,
        });
        if (anilistRes.data) {
          return { data: anilistRes.data as unknown as T, pagination: anilistRes.pagination };
        }
      } catch (anilistErr) {
        console.warn('[AniList search] Error:', anilistErr);
      }
    }

    return {
      data: [] as unknown as T,
      pagination: {
        last_visible_page: 1,
        has_next_page: false,
        current_page: page,
        items: { count: 0, total: 0, per_page: limit },
      },
    };
  }

  // 5. /api/anime/:id/characters
  const charMatch = path.match(/^\/api\/anime\/(\d+)\/characters$/);
  if (charMatch) {
    const malId = charMatch[1];
    const res = await fetchDirectJikan<CharacterItem[]>(`/anime/${malId}/characters`);
    return { data: res.data as unknown as T };
  }

  // 6. /api/anime/:id/recommendations
  const recMatch = path.match(/^\/api\/anime\/(\d+)\/recommendations$/);
  if (recMatch) {
    const malId = recMatch[1];
    const res = await fetchDirectJikan<RecommendedAnimeItem[]>(`/anime/${malId}/recommendations`);
    return { data: res.data as unknown as T };
  }

  // 7. /api/anime/:id (Detail)
  const detailMatch = path.match(/^\/api\/anime\/(\d+)$/);
  if (detailMatch) {
    const malId = detailMatch[1];
    const res = await fetchDirectJikan<AnimeItem>(`/anime/${malId}/full`);
    return { data: res.data as unknown as T };
  }

  // 8. /api/anime/genres
  if (path === '/api/anime/genres') {
    const res = await fetchDirectJikan<JikanGenre[]>(`/genres/anime`);
    return { data: res.data as unknown as T };
  }

  // 9. /api/manga/top
  if (path === '/api/manga/top') {
    const page = params.get('page') || '1';
    const limit = params.get('limit') || '24';
    const res = await fetchDirectJikan<MangaItem[]>(`/top/manga?page=${page}&limit=${limit}`);
    return { data: res.data as unknown as T, pagination: res.pagination };
  }

  // 10. /api/manga/search
  if (path === '/api/manga/search') {
    const q = params.get('q') || '';
    const page = params.get('page') || '1';
    const limit = params.get('limit') || '24';
    const res = await fetchDirectJikan<MangaItem[]>(`/manga?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}&sfw=true`);
    return { data: res.data as unknown as T, pagination: res.pagination };
  }

  // 11. /api/anime/schedule
  if (path === '/api/anime/schedule') {
    const day = params.get('day');
    const dayParam = day ? `?filter=${encodeURIComponent(day.toLowerCase())}` : '';
    const res = await fetchDirectJikan<AiringScheduleItem[]>(`/schedules${dayParam}`);
    return { data: res.data as unknown as T };
  }

  // 12. /api/characters/:id
  const charDetailMatch = path.match(/^\/api\/characters\/(\d+)$/);
  if (charDetailMatch) {
    const charId = charDetailMatch[1];
    const res = await fetchDirectJikan<CharacterDetail>(`/characters/${charId}/full`);
    return { data: res.data as unknown as T };
  }

  // 13. /api/people/:id
  const personDetailMatch = path.match(/^\/api\/people\/(\d+)$/);
  if (personDetailMatch) {
    const personId = personDetailMatch[1];
    const res = await fetchDirectJikan<PersonDetail>(`/people/${personId}/full`);
    return { data: res.data as unknown as T };
  }

  return null;
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
  limit: number = 100,
  page: number = 1,
  genre?: string,
  year?: string
): Promise<AnimeItem[]> {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (genre && genre !== 'all') params.set('genre', genre);
  if (year && year !== 'all') params.set('year', year);
  if (limit) params.set('limit', String(limit));
  if (page) params.set('page', String(page));

  const url = `/api/anime/top100?${params.toString()}`;
  const res = await fetchFromApi<AnimeItem[]>(url, []);
  return Array.isArray(res.data) ? res.data : [];
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
  if (id === 34246) return null;
  const res = await fetchFromApi<AnimeItem | null>(`/api/anime/${id}`, null);
  if (res.data && isNsfwOrAdultClient(res.data)) return null;
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

export async function getAiringSchedule(day?: string): Promise<AiringScheduleItem[]> {
  const endpoint = day ? `/api/anime/schedule?day=${encodeURIComponent(day)}` : '/api/anime/schedule';
  const res = await fetchFromApi<AiringScheduleItem[]>(endpoint, []);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getAnimeRecommendations(id: number): Promise<RecommendedAnimeItem[]> {
  const endpoint = `/api/anime/${id}/recommendations`;
  const res = await fetchFromApi<RecommendedAnimeItem[]>(endpoint, []);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getCharacterDetails(id: number, name?: string): Promise<CharacterDetail | null> {
  const param = name ? `?name=${encodeURIComponent(name)}` : '';
  const endpoint = `/api/characters/${id}${param}`;
  const res = await fetchFromApi<CharacterDetail | null>(endpoint, null);
  return res.data;
}

export async function getPersonDetails(id: number, name?: string): Promise<PersonDetail | null> {
  const param = name ? `?name=${encodeURIComponent(name)}` : '';
  const endpoint = `/api/people/${id}${param}`;
  const res = await fetchFromApi<PersonDetail | null>(endpoint, null);
  return res.data;
}
