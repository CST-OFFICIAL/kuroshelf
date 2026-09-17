const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

code = code.replace(
  'const anilistData = await searchAnilistFallback',
  'console.log("Triggering anilist fallback for:", clean); const anilistData = await searchAnilistFallback'
);

code = code.replace(
  'if (!data?.data?.Page?.media) return [];',
  'console.log("Anilist fallback returned:", data?.data?.Page?.media?.length); if (!data?.data?.Page?.media) return [];'
);

fs.writeFileSync('server/jikanService.ts', code);
