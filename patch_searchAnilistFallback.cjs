const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const targetFunction = `async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string, typeApi: string = "ALL", statusStr?: string, orderBy?: string): Promise<BaseJikanAnime[]> {
  const genreStr = genreId && genreId !== 'all' ? GENRE_MAP[genreId] : undefined;
  const formatStr = typeApi && typeApi !== 'ALL' ? typeApi : undefined;
  const statusApi = statusStr && statusStr !== 'all' ? STATUS_MAP[statusStr.toLowerCase()] : undefined;`;

const replacement = `async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string, typeApi: string = "ALL", statusStr?: string, orderBy?: string, originalType?: string): Promise<BaseJikanAnime[]> {
  const genreStr = genreId && genreId !== 'all' ? GENRE_MAP[genreId] : undefined;
  const formatStr = originalType && originalType !== 'all' ? FORMAT_MAP[originalType.toLowerCase()] : undefined;
  const statusApi = statusStr && statusStr !== 'all' ? STATUS_MAP[statusStr.toLowerCase()] : undefined;`;

if (code.includes(targetFunction)) {
  code = code.replace(targetFunction, replacement);
  fs.writeFileSync('server/jikanService.ts', code);
  console.log("Patched function signature");
} else {
  console.log("Could not find function signature");
}

