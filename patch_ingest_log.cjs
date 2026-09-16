const fs = require('fs');
let content = fs.readFileSync('server/ingestionService.ts', 'utf-8');

content = content.replace(
  /console\.error\(\`Failed to ingest anime \$\{item\.mal_id\}:\`, err\);/,
  "console.log(`[Ingestion] Failed to ingest anime ${item.mal_id}:`, err.message || err.code || err);"
);

fs.writeFileSync('server/ingestionService.ts', content);
