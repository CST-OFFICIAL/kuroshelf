import fs from 'fs';
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);

  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),`;

const replacement = `  const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);

  if (res.data === null) {
    throw new Error('Jikan API search unavailable');
  }

  return {
    data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),`;

content = content.replace(target, replacement);
fs.writeFileSync('server/jikanService.ts', content);
