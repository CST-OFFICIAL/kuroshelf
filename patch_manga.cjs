const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `export async function serverSearchManga(query: string, page: number = 1, limit: number = 24) {
  const clean = query.trim();
  if (!clean) return serverGetTopManga(page, limit);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);
  const endpoint = \`/manga?q=\${encodeURIComponent(clean)}&page=\${safePage}&limit=\${safeLimit}\`;
  const res = await fetchFromJikan<unknown[]>(endpoint, SEARCH_CACHE_TTL_MS);
  return {
    data: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination,
  };
}`;

const replacement = `export async function serverSearchManga(query: string, page: number = 1, limit: number = 24) {
  const clean = query.trim();
  if (!clean) return serverGetTopManga(page, limit);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 25);
  const endpoint = \`/manga?q=\${encodeURIComponent(clean)}&page=\${safePage}&limit=\${safeLimit}\`;
  
  try {
    const res = await fetchFromJikan<unknown[]>(endpoint, SEARCH_CACHE_TTL_MS);
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, pagination: res.pagination };
    }
  } catch (err) {}
  
  // Anilist fallback
  const anilistData = await searchAnilistFallback(clean, safePage, safeLimit, undefined, "MANGA", undefined, undefined, "manga");
  if (anilistData && anilistData.length > 0) {
    return {
      data: anilistData,
      pagination: {
        current_page: safePage,
        has_next_page: anilistData.length === safeLimit,
        last_visible_page: safePage + (anilistData.length === safeLimit ? 1 : 0),
        items: { count: anilistData.length, total: 10000, per_page: safeLimit }
      }
    };
  }
  
  return { data: [], pagination: { current_page: safePage, has_next_page: false, last_visible_page: safePage, items: { count: 0, total: 0, per_page: safeLimit } } };
}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server/jikanService.ts', code);
  console.log("Patched manga search");
} else {
  console.log("Could not find manga search target");
}
