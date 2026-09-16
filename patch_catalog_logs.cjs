const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /console\.error\('searchCatalogAnime error:', error\);/,
  "console.log('[Catalog] searchCatalogAnime DB query error (falling back to live API if needed):', error.message);"
);

content = content.replace(
  /console\.warn\('\[Catalog\] Live API Top Anime fallback failed:', err\.message\);/,
  "console.log('[Catalog] Live API Top Anime fallback failed:', err.message);"
);

content = content.replace(
  /console\.warn\('\[Catalog\] Live API ingestion failed:', err\.message\);/,
  "console.log('[Catalog] Live API ingestion failed:', err.message);"
);

content = content.replace(
  /console\.warn\('\[Catalog\] Jikan API search failed, falling back to local DB:', err\.message\);/,
  "console.log('[Catalog] Jikan API search failed, falling back to local DB:', err.message);"
);

fs.writeFileSync('server/catalogService.ts', content);
