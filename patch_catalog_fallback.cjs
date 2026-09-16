const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /export async function searchCatalogAnime\(options: any\): Promise<\{ data: AnimeItem\[\], pagination: JikanPagination \}> \{\n  \/\/ Always search via Jikan to guarantee full 25,000\+ catalog access\n  const jikanResult = await jikanSearch\(options\);\n  if \(jikanResult\.data && jikanResult\.data\.length > 0\) \{\n    ingestAnimeList\(jikanResult\.data\)\.catch\(\(\) => \{\}\);\n  \}\n  return jikanResult as any;\n\n  \/\/ Unused local fallback block below\n  if \(!isSupabaseConfigured\) return await jikanSearch\(options\) as any;/g,
  `export async function searchCatalogAnime(options: any): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);
  const offset = (page - 1) * limit;
  const clean = options.query?.trim() || '';

  // Try Jikan first for full catalog access
  try {
    const jikanResult = await jikanSearch(options);
    if (jikanResult.data && jikanResult.data.length > 0) {
      ingestAnimeList(jikanResult.data).catch(() => {});
      return jikanResult as any;
    }
  } catch (err) {
    console.error('[Catalog] Jikan API search failed, falling back to local DB:', err.message);
  }

  // Fallback to local DB if Jikan is down or returned nothing
  if (!isSupabaseConfigured) {
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: limit } } };
  }`
);

fs.writeFileSync('server/catalogService.ts', content);
