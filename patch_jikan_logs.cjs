const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

content = content.replace(
  /console\.warn\('\[Jikan\] Search failed, falling back to Anilist API\. Query:', clean, 'Genre:', options\.genres\);/g,
  "console.log('[Jikan] Search failed, falling back to Anilist API. Query:', clean, 'Genre:', options.genres);"
);

content = content.replace(
  /console\.error\('Anilist fallback error', err\);/g,
  "console.log('[Anilist] Fallback error', err.message);"
);

fs.writeFileSync('server/jikanService.ts', content);
