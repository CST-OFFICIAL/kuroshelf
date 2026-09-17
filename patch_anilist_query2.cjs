const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const targetFuncStart = `  const anilistQuery = \`
  query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [\${sort}], isAdult: false, genreNotIn: ["Hentai"]) {`;

const replacementFuncStart = `  const typeArg = typeApi !== 'ALL' ? ', $type: MediaType' : '';
  const typeFilter = typeApi !== 'ALL' ? ', type: $type' : '';
  const anilistQuery = \`
  query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int\${typeArg}) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, genre: $genre, format: $format, status: $status, sort: [\${sort}], isAdult: false, genreNotIn: ["Hentai"]\${typeFilter}) {`;

code = code.replace(targetFuncStart, replacementFuncStart);
fs.writeFileSync('server/jikanService.ts', code);
