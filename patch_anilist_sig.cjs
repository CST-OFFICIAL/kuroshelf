const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

code = code.replace(
  /async function searchAnilistFallback\(query: string, page: number, limit: number, genreId\?: string, type\?: string, statusStr\?: string, orderBy\?: string\)/,
  'async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string, typeApi: string = "ALL", statusStr?: string, orderBy?: string)'
);

fs.writeFileSync('server/jikanService.ts', code);
