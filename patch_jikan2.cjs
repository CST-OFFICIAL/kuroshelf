const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

// The original signature had formatStr. We replaced it with typeApi? No, let's restore it.
code = code.replace(
  `async function searchAnilistFallback(query: string, page: number, limit: number, genreStr?: string, typeApi: string = 'ANIME', statusApi?: string, orderBy?: string) {`,
  `async function searchAnilistFallback(query: string, page: number, limit: number, genreStr?: string, typeApi: string = 'ANIME', formatStr?: string, statusApi?: string, orderBy?: string) {`
);

// We also need to fix the call site in serverSearchAnime
code = code.replace(
  `const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy);`,
  `const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, undefined, options.status, options.orderBy);`
);

fs.writeFileSync('server/jikanService.ts', code);
