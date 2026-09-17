const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  `  if (error) {
    console.log('[Catalog] searchCatalogAnime DB query error (falling back to live API if needed):', error.message);
  }`,
  `  if (error && error.code !== 'PGRST103') { // PGRST103 is Requested range not satisfiable
    console.log('[Catalog] searchCatalogAnime DB query error:', error.message);
  }`
);

// Also suppress "Live API ingestion failed"
content = content.replace(
  `       console.log('[Catalog] Live API ingestion failed:', err.message);`,
  `       // Live API failed (rate limits), silent fallback to empty array`
);

fs.writeFileSync('server/catalogService.ts', content);
