const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const targetFallbackCall = `      let anilistType = 'ANIME';
      if (options.type === 'manga' || options.type === 'novel' || options.type === 'manhwa' || options.type === 'manhua') {
        anilistType = 'MANGA';
      }
      const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, undefined, options.status, options.orderBy);`;

const replacementFallbackCall = `      let anilistType = 'ALL';
      if (options.type === 'manga' || options.type === 'novel' || options.type === 'manhwa' || options.type === 'manhua') {
        anilistType = 'MANGA';
      } else if (options.type && options.type !== 'all') {
        anilistType = 'ANIME';
      }
      const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, undefined, options.status, options.orderBy);`;

code = code.replace(targetFallbackCall, replacementFallbackCall);

const targetAnilistFunc = `async function searchAnilistFallback(query: string, page: number, limit: number, genreStr?: string, typeApi: string = 'ANIME', formatStr?: string, statusApi?: string, orderBy?: string) {`;
const replacementAnilistFunc = `async function searchAnilistFallback(query: string, page: number, limit: number, genreStr?: string, typeApi: string = 'ALL', formatStr?: string, statusApi?: string, orderBy?: string) {`;

code = code.replace(targetAnilistFunc, replacementAnilistFunc);

const targetAnilistQueryRun = `    const variables: any = { page, perPage: limit, type: typeApi };
    if (query) variables.search = query;`;
const replacementAnilistQueryRun = `    const variables: any = { page, perPage: limit };
    if (typeApi !== 'ALL') variables.type = typeApi;
    if (query) variables.search = query;`;

code = code.replace(targetAnilistQueryRun, replacementAnilistQueryRun);

const targetAnilistQueryString = `query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int, $type: MediaType) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: $type, genre: $genre`;

const replacementAnilistQueryString = `query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int, $type: MediaType) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: $type, genre: $genre`;

// Actually we need to make $type optional if typeApi === 'ALL', wait, Anilist GraphQL requires `type: MediaType` to be omitted if we want both!
// If we pass `$type: MediaType`, and omit it, does it default to both? No, we might need a separate query string or just not specify type in the graphql query.
