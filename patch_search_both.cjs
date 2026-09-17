const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `  let baseEndpoint = '/anime';
  if (options.type === 'manga' || options.type === 'novel' || options.type === 'lightnovel' || options.type === 'oneshot' || options.type === 'doujin' || options.type === 'manhwa' || options.type === 'manhua') {
    baseEndpoint = '/manga';
  }
  const endpoint = \`\${baseEndpoint}?\${params.toString()}\`;
  try {
    const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);
    if (res.data === null) {
      throw new Error('Jikan API search unavailable');
    }
    return {
      data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
      pagination: res.pagination,
    };
  } catch (err) {`;

const replacement = `  try {
    if (!options.type || options.type === 'all') {
      // Search BOTH Anime and Manga
      const endpointAnime = \`/anime?\${params.toString()}\`;
      const endpointManga = \`/manga?\${params.toString()}\`;
      
      const [resAnime, resManga] = await Promise.all([
        fetchFromJikan(endpointAnime, SEARCH_CACHE_TTL_MS).catch(() => ({ data: [], pagination: {} })),
        fetchFromJikan(endpointManga, SEARCH_CACHE_TTL_MS).catch(() => ({ data: [], pagination: {} }))
      ]);
      
      const combinedData = [...(resAnime.data || []), ...(resManga.data || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
      return {
        data: deduplicateByMalId(combinedData).slice(0, limit),
        pagination: resAnime.pagination || resManga.pagination,
      };
    } else {
      let baseEndpoint = '/anime';
      if (options.type === 'manga' || options.type === 'novel' || options.type === 'lightnovel' || options.type === 'oneshot' || options.type === 'doujin' || options.type === 'manhwa' || options.type === 'manhua') {
        baseEndpoint = '/manga';
      }
      const endpoint = \`\${baseEndpoint}?\${params.toString()}\`;
      
      const res = await fetchFromJikan(endpoint, SEARCH_CACHE_TTL_MS);
      if (res.data === null) throw new Error('Jikan API search unavailable');
      
      return {
        data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
        pagination: res.pagination,
      };
    }
  } catch (err) {`;

code = code.replace(target, replacement);
fs.writeFileSync('server/jikanService.ts', code);
