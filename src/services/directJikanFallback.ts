const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Safety filter client-side
export function isNsfwOrAdultClient(item: any): boolean {
  if (!item) return false;
  const malId = Number(item.mal_id || item.id);
  if (malId === 34246) return true;
  if (item.isAdult === true) return true;
  const rating = String(item.rating || '').toLowerCase();
  if (rating.includes('rx') || rating.includes('hentai') || rating.includes('18+')) return true;

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

  const title = `${item.title || ''} ${item.title_english || ''} ${item.title_japanese || ''}`.toLowerCase();
  if (title.includes('rina witch') || title.includes('kimi no mana wa') || title.includes('your magical name is rina')) {
    return true;
  }
  return false;
}

export function deduplicateAnime<T extends { mal_id?: number; id?: number }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<number>();
  return items.filter((item) => {
    const id = Number(item.mal_id ?? item.id);
    if (!id || isNsfwOrAdultClient(item) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Simple rate-limit friendly direct requester with caching
const clientDirectCache = new Map<string, { data: any; pagination?: any; ts: number }>();
const CLIENT_CACHE_TTL = 1000 * 60 * 20; // 20 minutes

export async function fetchDirectJikan<T = any>(endpoint: string): Promise<{ data: T; pagination?: any }> {
  const cacheKey = endpoint;
  const cached = clientDirectCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CLIENT_CACHE_TTL) {
    return { data: cached.data as T, pagination: cached.pagination };
  }

  const url = `${JIKAN_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    throw new Error(`Jikan returned ${res.status}`);
  }
  const json = await res.json();
  if (json.status && json.status >= 400) {
    throw new Error(`Jikan error ${json.status}: ${json.message || 'Error'}`);
  }
  const rawData = json.data as T;
  const pagination = json.pagination;

  // Filter if it's an array of anime/manga
  let cleanedData: any = rawData;
  if (Array.isArray(rawData)) {
    cleanedData = deduplicateAnime(rawData);
  } else if (rawData && typeof rawData === 'object' && isNsfwOrAdultClient(rawData)) {
    cleanedData = null;
  }

  clientDirectCache.set(cacheKey, { data: cleanedData, pagination, ts: Date.now() });
  return { data: cleanedData, pagination };
}
