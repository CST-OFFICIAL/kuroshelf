const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

// For serverSearchAnime
content = content.replace(
  /  if \(clean\) params\.set\('q', clean\);\n  if \(page > 1\) params\.set\('page', String\(page\)\);\n  \/\/ Jikan's default limit is 25, if they want 24 we can just fetch 25 and slice it later,\n  \/\/ but to maximize cache hits we will omit limit and page if they are standard\.\n  \/\/ Actually let's just omit limit if it's 24 or 25 to hit more caches\.\n  \/\/ We'll omit limit altogether\.\n  \/\/ But wait, the frontend sends limit=24\. If we omit it, it fetches 25\./,
  `  if (clean) params.set('q', clean);
  if (page > 1) params.set('page', String(page));`
);

// For serverGetTopAnime
content = content.replace(
  /  params\.set\('page', String\(safePage\)\);\n  params\.set\('limit', String\(safeLimit\)\);/,
  `  if (safePage > 1) params.set('page', String(safePage));`
);

// For serverGetSeasonalAnime
content = content.replace(
  /  const endpoint = \`\/seasons\/now\?page=\$\{safePage\}&limit=\$\{safeLimit\}\`;/,
  `  const endpoint = safePage > 1 ? \`/seasons/now?page=\$\{safePage\}\` : \`/seasons/now\`;`
);

// For serverGetUpcomingAnime
content = content.replace(
  /  const endpoint = \`\/seasons\/upcoming\?page=\$\{safePage\}&limit=\$\{safeLimit\}\`;/,
  `  const endpoint = safePage > 1 ? \`/seasons/upcoming?page=\$\{safePage\}\` : \`/seasons/upcoming\`;`
);

fs.writeFileSync('server/jikanService.ts', content);
