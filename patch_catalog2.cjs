const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

// Restore fallback for getCatalogTopAnime
content = content.replace(
  /  \/\/ Always return local data\. The background scraper handles ingestion\.\n  return \{\n    data: \(data \|\| \[\]\)\.map\(mapDbToAnime\) as any\[\],/,
  `  // Local DB miss fallback (e.g. if daemon couldn't ingest due to missing service key)
  if ((!data || data.length === 0) && page <= 3) {
    try {
      console.log(\`[Catalog] Local DB has 0 items for filter '\${filter}' page \${page}, falling back to Live API...\`);
      let jikanRes;
      if (filter === 'airing') jikanRes = await serverGetSeasonalAnime(page, limit);
      else if (filter === 'upcoming') jikanRes = await serverGetUpcomingAnime(page, limit);
      else jikanRes = await serverGetTopAnime(filter, page, limit);

      if (jikanRes.data) {
        ingestAnimeList(jikanRes.data).catch(() => {});
        return jikanRes as any;
      }
    } catch (err) {
      console.warn('[Catalog] Live API Top Anime fallback failed:', err.message);
    }
  }

  return {
    data: (data || []).map(mapDbToAnime) as any[],`
);

// Restore fallback for searchCatalogAnime (which handles genres)
content = content.replace(
  /  if \(clean && \(!data \|\| data\.length === 0\)\) \{\n     try \{\n       console\.log\('\[Catalog\] Local DB search empty for query, triggering live API ingestion\.\.\.'\);\n       const jikanResult = await jikanSearch\(options\);\n       if \(jikanResult\.data && jikanResult\.data\.length > 0\) \{\n         ingestAnimeList\(jikanResult\.data\)\.catch\(\(\) => \{\}\);\n         return jikanResult as any;\n       \}\n     \} catch \(err\) \{\n       console\.warn\('\[Catalog\] Live API ingestion failed:', err\.message\);\n     \}\n  \}/,
  `  // If local DB is empty, trigger Live API fallback for queries and genre searches
  if ((clean || options.genres !== 'all') && (!data || data.length === 0)) {
     try {
       console.log('[Catalog] Local DB search empty, triggering live API ingestion...');
       const jikanResult = await jikanSearch(options);
       if (jikanResult.data && jikanResult.data.length > 0) {
         ingestAnimeList(jikanResult.data).catch(() => {});
         return jikanResult as any;
       }
     } catch (err) {
       console.warn('[Catalog] Live API ingestion failed:', err.message);
     }
  }`
);

fs.writeFileSync('server/catalogService.ts', content);
