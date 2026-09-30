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

export function getBookUrl(malId: number, title?: string): string {
  const slug = title ? slugify(title) : '';
  return slug ? `/books/${malId}-${slug}` : `/books/${malId}`;
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

  // 2. Manga / Book detail
  const bookMatch = cleanPath.match(/^\/(?:manga|books)\/(\d+)(?:-.*)?$/);
  if (bookMatch) {
    const id = parseInt(bookMatch[1], 10);
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
    '/seasonal': 'seasonal',
    '/explore': 'explore',
    '/discover': 'discover',
    '/polls': 'polls',
    '/shelf': 'shelf',
    '/profile': 'profile',

    // Library / Books Portal Pages
    '/library': 'books',
    '/library/discover': 'books',
    '/books': 'books',
    '/books/all': 'books',
    '/library/catalog': 'books-catalog',
    '/books/catalog': 'books-catalog',
    '/library/seasons': 'books-seasons',
    '/library/seasonal': 'books-seasons',
    '/books/seasons': 'books-seasons',
    '/books/seasonal': 'books-seasons',
    '/library/manga': 'books-catalog',
    '/books/manga': 'books-catalog',
    '/manga': 'books-catalog',
    '/library/manhwa': 'books-catalog',
    '/books/manhwa': 'books-catalog',
    '/manhwa': 'books-catalog',
    '/library/manhua': 'books-catalog',
    '/books/manhua': 'books-catalog',
    '/manhua': 'books-catalog',
    '/library/novels': 'books-catalog',
    '/library/novel': 'books-catalog',
    '/books/novels': 'books-catalog',
    '/books/novel': 'books-catalog',
    '/novels': 'books-catalog',
    '/library/rankings': 'books-rankings',
    '/books/rankings': 'books-rankings',
    '/library/schedule': 'books-schedule',
    '/books/schedule': 'books-schedule',
    '/library/predictions': 'books-polls',
    '/library/polls': 'books-polls',
    '/books/predictions': 'books-polls',
    '/books/polls': 'books-polls',
    '/library/genres': 'books-genres',
    '/books/genres': 'books-genres',
    '/books/explore': 'books-genres',
  };

  if (tabRoutes[cleanPath]) {
    return { type: 'tab', tab: tabRoutes[cleanPath] };
  }

  return { type: 'home' };
}
