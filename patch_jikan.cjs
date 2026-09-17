const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const targetJikanEndpoint = `const endpoint = \`/anime?\${params.toString()}\`;`;
const replacementJikanEndpoint = `  let baseEndpoint = '/anime';
  if (options.type === 'manga' || options.type === 'novel' || options.type === 'lightnovel' || options.type === 'oneshot' || options.type === 'doujin' || options.type === 'manhwa' || options.type === 'manhua') {
    baseEndpoint = '/manga';
  }
  const endpoint = \`\${baseEndpoint}?\${params.toString()}\`;`;

code = code.replace(targetJikanEndpoint, replacementJikanEndpoint);

const targetAnilistFallback = `const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, options.type, options.status, options.orderBy);`;
const replacementAnilistFallback = `
      let anilistType = 'ANIME';
      if (options.type === 'manga' || options.type === 'novel' || options.type === 'manhwa' || options.type === 'manhua') {
        anilistType = 'MANGA';
      }
      const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy);`;

code = code.replace(targetAnilistFallback, replacementAnilistFallback);

const targetAnilistQuery = `query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME`;
const replacementAnilistQuery = `query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int, $type: MediaType) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: $type, genre: $genre`;

const targetAnilistQuery2 = `media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [\${sort}], isAdult: false, genreNotIn: ["Hentai"]) {`;
const replacementAnilistQuery2 = `media(search: $search, type: $type, genre: $genre, format: $format, status: $status, sort: [\${sort}], isAdult: false, genreNotIn: ["Hentai"]) {`;

// Replace first occurrence (function definition)
code = code.replace(`async function searchAnilistFallback(query: string, page: number, limit: number, genreStr?: string, formatStr?: string, statusApi?: string, orderBy?: string) {`, 
                    `async function searchAnilistFallback(query: string, page: number, limit: number, genreStr?: string, typeApi: string = 'ANIME', statusApi?: string, orderBy?: string) {`);

code = code.replace(targetAnilistQuery, replacementAnilistQuery);
code = code.replace(targetAnilistQuery2, replacementAnilistQuery2);

const targetVariables = `const variables: any = { page, perPage: limit };
    if (query) variables.search = query;`;
const replacementVariables = `const variables: any = { page, perPage: limit, type: typeApi };
    if (query) variables.search = query;`;
code = code.replace(targetVariables, replacementVariables);

// Wait, searchAnilistFallback arguments changed, formatStr was removed in the function signature replacement!
// Let's re-add formatStr or fix the signature.
