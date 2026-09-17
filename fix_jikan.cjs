const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

content = content.replace(
  `console.log('[Jikan] Search failed, falling back to Anilist API. Query:', clean, 'Genre:', options.genres);`,
  `// console.log('[Jikan] Search failed, falling back to Anilist API. Query:', clean, 'Genre:', options.genres);`
);

content = content.replace(
  `console.log('[Anilist] Fallback error', err.message);`,
  `// console.log('[Anilist] Fallback error', err.message);`
);

fs.writeFileSync('server/jikanService.ts', content);
