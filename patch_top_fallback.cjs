const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /  \/\/ Fallback to Jikan if Supabase DB is missing items for this page\n  if \(\!data \|\| data\.length < limit\) \{\n    console\.log\(`\[Catalog\] Local DB has \$\{data\?\.length \|\| 0\} items for filter '\$\{filter\}' page \$\{page\}, falling back to Jikan\.\.\.`\);\n    let jikanResult;\n    if \(filter === 'airing'\) \{\n      jikanResult = await serverGetSeasonalAnime\(page, limit\);\n    \} else if \(filter === 'upcoming'\) \{\n      jikanResult = await serverGetUpcomingAnime\(page, limit\);\n    \} else \{\n      jikanResult = await serverGetTopAnime\(filter, page, limit\);\n    \}\n    \n    if \(jikanResult && jikanResult\.data && jikanResult\.data\.length > 0\) \{\n      \/\/ Background ingestion\n      ingestAnimeList\(jikanResult\.data\)\.catch\(err => console\.error\('Fallback ingestion error:', err\)\);\n      return \{\n        data: jikanResult\.data as any\[\],\n        pagination: jikanResult\.pagination \|\| \{ last_visible_page: page \+ \(jikanResult\.data\.length === limit \? 1 : 0\), has_next_page: jikanResult\.data\.length === limit, current_page: page, items: \{ count: jikanResult\.data\.length, total: 10000, per_page: limit \} \}\n      \};\n    \}\n  \}/g,
  `  // Fallback to Jikan if Supabase DB is missing items for this page
  if (!data || data.length < limit) {
    try {
      console.log(\`[Catalog] Local DB has \${data?.length || 0} items for filter '\${filter}' page \${page}, falling back to Jikan...\`);
      let jikanResult;
      if (filter === 'airing') {
        jikanResult = await serverGetSeasonalAnime(page, limit);
      } else if (filter === 'upcoming') {
        jikanResult = await serverGetUpcomingAnime(page, limit);
      } else {
        jikanResult = await serverGetTopAnime(filter, page, limit);
      }
      
      if (jikanResult && jikanResult.data && jikanResult.data.length > 0) {
        // Background ingestion
        ingestAnimeList(jikanResult.data).catch(err => console.error('Fallback ingestion error:', err));
        return {
          data: jikanResult.data as any[],
          pagination: jikanResult.pagination || { last_visible_page: page + (jikanResult.data.length === limit ? 1 : 0), has_next_page: jikanResult.data.length === limit, current_page: page, items: { count: jikanResult.data.length, total: 10000, per_page: limit } }
        };
      }
    } catch (err) {
      console.error('[Catalog] Jikan API fallback failed in top anime:', err.message);
    }
  }`
);

fs.writeFileSync('server/catalogService.ts', content);
