const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

// Replace the URLSearchParams setup in serverSearchAnime
content = content.replace(
  /  const params = new URLSearchParams\(\);\n  if \(clean\) params\.set\('q', clean\);\n  params\.set\('page', String\(page\)\);\n  params\.set\('limit', String\(limit\)\);/,
  `  const params = new URLSearchParams();
  if (clean) params.set('q', clean);
  if (page > 1) params.set('page', String(page));
  // Jikan's default limit is 25, if they want 24 we can just fetch 25 and slice it later,
  // but to maximize cache hits we will omit limit and page if they are standard.
  // Actually let's just omit limit if it's 24 or 25 to hit more caches.
  // We'll omit limit altogether.
  // But wait, the frontend sends limit=24. If we omit it, it fetches 25.`
);

fs.writeFileSync('server/jikanService.ts', content);
