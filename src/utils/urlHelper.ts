export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

export function getAnimeUrl(malId: number, title?: string): string {
  const slug = title ? slugify(title) : '';
  return slug ? `/anime/${malId}-${slug}` : `/anime/${malId}`;
}

export function getMangaUrl(malId: number, title?: string): string {
  const slug = title ? slugify(title) : '';
  return slug ? `/manga/${malId}-${slug}` : `/manga/${malId}`;
}

export type ParsedRoute =
  | { type: 'anime'; id: number }
  | { type: 'manga'; id: number }
  | { type: 'tab'; tab: string }
  | { type: 'info'; infoType: string }
  | { type: 'home' };

export function parseRoute(pathname: string): ParsedRoute {
  const cleanPath = (pathname || '/').trim().replace(/\/+$/, '') || '/';

  // 1. Anime detail
  const animeMatch = cleanPath.match(/^\/anime\/(\d+)(?:-.*)?$/);
  if (animeMatch) {
    const id = parseInt(animeMatch[1], 10);
    if (!isNaN(id) && id > 0) {
      return { type: 'anime', id };
    }
  }

  // 2. Manga detail
  const mangaMatch = cleanPath.match(/^\/manga\/(\d+)(?:-.*)?$/);
  if (mangaMatch) {
    const id = parseInt(mangaMatch[1], 10);
    if (!isNaN(id) && id > 0) {
      return { type: 'manga', id };
    }
  }

  // 3. Info / Policy modals
  const infoTypes = ['privacy', 'terms', 'about', 'dmca', 'cookies', 'faq', 'contact'];
  for (const info of infoTypes) {
    if (cleanPath === `/${info}`) {
      return { type: 'info', infoType: info };
    }
  }

  // 4. Tab routes
  const tabRoutes: Record<string, string> = {
    '/schedule': 'schedule',
    '/rankings': 'rankings',
    '/manga': 'manga',
    '/seasonal': 'seasonal',
    '/explore': 'explore',
    '/discover': 'discover',
    '/polls': 'polls',
    '/shelf': 'shelf',
    '/profile': 'profile',
  };

  if (tabRoutes[cleanPath]) {
    return { type: 'tab', tab: tabRoutes[cleanPath] };
  }

  return { type: 'home' };
}
