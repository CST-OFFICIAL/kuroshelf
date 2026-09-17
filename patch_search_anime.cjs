const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `  const endpoint = \`/anime?\${params.toString()}\`;
  try {
    const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);
    if (res.data === null) {
      throw new Error('Jikan API search unavailable');
    }
    return {
      data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
      pagination: res.pagination,
    };
  } catch (err) {
    if (true) {
      // console.log('[Jikan] Search failed, falling back to Anilist API. Query:', clean, 'Genre:', options.genres);
      const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, options.type, options.status, options.orderBy);
      if (anilistData && anilistData.length > 0) {
        return {
          data: anilistData,
          pagination: {
            current_page: page,
            has_next_page: anilistData.length === limit,
            last_visible_page: page + (anilistData.length === limit ? 1 : 0),
            items: { count: anilistData.length, total: 10000, per_page: limit }
          }
        };
      }
    }
    throw err;
  }`;

const replacement = `  let baseEndpoint = '/anime';
  let anilistType = 'ALL';
  
  if (options.type === 'manga' || options.type === 'novel' || options.type === 'manhwa' || options.type === 'manhua') {
    baseEndpoint = '/manga';
    anilistType = 'MANGA';
  } else if (options.type && options.type !== 'all') {
    anilistType = 'ANIME';
  }

  const endpoint = \`\${baseEndpoint}?\${params.toString()}\`;
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
    
    // If Jikan fails or returns empty for a valid string query, force fallback to Anilist!
    if ((!jikanData || jikanData.length === 0) && clean) {
       const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy);
       if (anilistData && anilistData.length > 0) {
          return {
            data: anilistData,
            pagination: {
              current_page: page,
              has_next_page: anilistData.length === limit,
              last_visible_page: page + (anilistData.length === limit ? 1 : 0),
              items: { count: anilistData.length, total: 10000, per_page: limit }
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
  }`;

code = code.replace(target, replacement);
fs.writeFileSync('server/jikanService.ts', code);
