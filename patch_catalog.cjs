const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

// Replace getCatalogTopAnime to prefer Local DB
content = content.replace(
  /export async function getCatalogTopAnime\(filter: string = 'bypopularity', page: number = 1, limit: number = 24\): Promise<\{ data: AnimeItem\[\], pagination: JikanPagination \}> \{\n  console\.log\('getCatalogTopAnime called, isSupabaseConfigured:', isSupabaseConfigured\);\n  if \(\!isSupabaseConfigured\) \{\n    if \(filter === 'airing'\) return await serverGetSeasonalAnime\(page, limit\) as any;\n    if \(filter === 'upcoming'\) return await serverGetUpcomingAnime\(page, limit\) as any;\n    return await serverGetTopAnime\(filter, page, limit\) as any;\n  \}\n\n  const offset = \(page - 1\) \* limit;\n  let query = supabase\.from\('anime'\)\.select\('\*', \{ count: 'exact' \}\);\n  if \(filter === 'airing'\) \{\n    query = query\.eq\('status', 'Currently Airing'\)\.order\('score', \{ ascending: false, nullsFirst: false \}\);\n  \} else if \(filter === 'upcoming'\) \{\n    query = query\.eq\('status', 'Not yet aired'\)\.order\('popularity', \{ ascending: true \}\);\n  \} else if \(filter === 'favorite'\) \{\n    query = query\.order\('score', \{ ascending: false, nullsFirst: false \}\);\n  \} else \{\n    query = query\.order\('popularity', \{ ascending: true \}\);\n  \}\n\n  query = query\.range\(offset, offset \+ limit - 1\);\n  const \{ data, count, error \} = await query;\n\n  if \(error\) \{\n    console\.error\('getCatalogTopAnime error:', error\);\n  \}\n\n  \/\/ Local DB miss fallback\n  if \(\(!data \|\| data\.length === 0\) && page <= 3\) \{\n    try \{\n      console\.log\(\`\[Catalog\] Local DB has \$\{data\?\.length \|\| 0\} items for filter '\$\{filter\}' page \$\{page\}, falling back to Jikan\.\.\.\`\);\n      let jikanRes;\n      if \(filter === 'airing'\) jikanRes = await serverGetSeasonalAnime\(page, limit\);\n      else if \(filter === 'upcoming'\) jikanRes = await serverGetUpcomingAnime\(page, limit\);\n      else jikanRes = await serverGetTopAnime\(filter, page, limit\);\n\n      if \(jikanRes\.data\) \{\n        ingestAnimeList\(jikanRes\.data\)\.catch\(\(\) => \{\}\);\n        return jikanRes as any;\n      \}\n    \} catch \(err\) \{\n      console\.warn\('\[Catalog\] Jikan Top Anime fallback failed:', err\.message\);\n    \}\n  \}\n\n  return \{\n    data: \(data \|\| \[\]\)\.map\(mapDbToAnime\) as any\[\],\n    pagination: \{\n      last_visible_page: Math\.ceil\(\(count \|\| 0\) \/ limit\),\n      has_next_page: offset \+ limit < \(count \|\| 0\),\n      current_page: page,\n      items: \{ count: data\?\.length \|\| 0, total: count \|\| 0, per_page: limit \}\n    \}\n  \};\n\}/g,
  `export async function getCatalogTopAnime(filter: string = 'bypopularity', page: number = 1, limit: number = 24): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  const offset = (page - 1) * limit;
  let query = supabase.from('anime').select('*', { count: 'exact' });
  if (filter === 'airing') {
    query = query.eq('status', 'Currently Airing').order('score', { ascending: false, nullsFirst: false });
  } else if (filter === 'upcoming') {
    query = query.eq('status', 'Not yet aired').order('popularity', { ascending: true });
  } else if (filter === 'favorite') {
    query = query.order('score', { ascending: false, nullsFirst: false });
  } else {
    query = query.order('popularity', { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);
  const { data, count, error } = await query;

  if (error) {
    console.error('getCatalogTopAnime error:', error);
  }

  // Always return local data. The background scraper handles ingestion.
  return {
    data: (data || []).map(mapDbToAnime) as any[],
    pagination: {
      last_visible_page: Math.ceil((count || 0) / limit),
      has_next_page: offset + limit < (count || 0),
      current_page: page,
      items: { count: data?.length || 0, total: count || 0, per_page: limit }
    }
  };
}`
);

// Replace searchCatalogAnime to prefer Local DB
content = content.replace(
  /export async function searchCatalogAnime\(options: any\): Promise<\{ data: AnimeItem\[\], pagination: JikanPagination \}> \{\n  const page = Math\.max\(Number\(options\.page\) \|\| 1, 1\);\n  const limit = Math\.min\(Math\.max\(Number\(options\.limit\) \|\| 24, 1\), 25\);\n  const offset = \(page - 1\) \* limit;\n  const clean = options\.query\?\.trim\(\) \|\| '';\n\n  \/\/ Try Jikan first for full catalog access\n  try \{\n    const jikanResult = await jikanSearch\(options\);\n    if \(jikanResult\.data && jikanResult\.data\.length > 0\) \{\n      ingestAnimeList\(jikanResult\.data\)\.catch\(\(\) => \{\}\);\n      return jikanResult as any;\n    \}\n  \} catch \(err\) \{\n    console\.warn\('\[Catalog\] Jikan API search failed, falling back to local DB:', err\.message\);\n  \}\n\n  \/\/ Fallback to local DB if Jikan is down or returned nothing\n  if \(\!isSupabaseConfigured\) \{\n    return \{ data: \[\], pagination: \{ last_visible_page: 1, has_next_page: false, current_page: 1, items: \{ count: 0, total: 0, per_page: limit \} \} \};\n  \}/g,
  `export async function searchCatalogAnime(options: any): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);
  const offset = (page - 1) * limit;
  const clean = options.query?.trim() || '';

  if (!isSupabaseConfigured) {
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: limit } } };
  }`
);

// We need to also hook in anilist fallback ONLY if clean is provided and local DB returns 0.
content = content.replace(
  /  const \{ data, count, error \} = await query;\n  if \(error\) \{\n    console\.error\('searchCatalogAnime error:', error\);\n  \}\n\n\n\n  return \{\n    data: \(data \|\| \[\]\)\.map\(mapDbToAnime\) as any\[\],\n    pagination: \{/g,
  `  const { data, count, error } = await query;
  if (error) {
    console.error('searchCatalogAnime error:', error);
  }

  // If local DB is empty and user explicitly searched for something, try to pull it from Anilist/Jikan
  if (clean && (!data || data.length === 0)) {
     try {
       console.log('[Catalog] Local DB search empty for query, triggering live API ingestion...');
       const jikanResult = await jikanSearch(options);
       if (jikanResult.data && jikanResult.data.length > 0) {
         ingestAnimeList(jikanResult.data).catch(() => {});
         return jikanResult as any;
       }
     } catch (err) {
       console.warn('[Catalog] Live API ingestion failed:', err.message);
     }
  }

  return {
    data: (data || []).map(mapDbToAnime) as any[],
    pagination: {`
);

fs.writeFileSync('server/catalogService.ts', content);
