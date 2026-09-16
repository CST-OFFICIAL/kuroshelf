const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

const mappingCode = `
const GENRE_MAP: Record<string, string> = {
  '1': 'Action',
  '2': 'Adventure',
  '4': 'Comedy',
  '8': 'Drama',
  '10': 'Fantasy',
  '22': 'Romance',
  '24': 'Sci-Fi',
  '36': 'Slice of Life',
  '62': 'Isekai',
  '14': 'Horror',
  '7': 'Mystery',
  '30': 'Sports'
};

async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string): Promise<BaseJikanAnime[]> {
  const genreStr = genreId ? GENRE_MAP[genreId] : undefined;
  
  let anilistQuery = \`
  query ($search: String) {
    Page(page: \${page}, perPage: \${limit}) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        idMal
        title { romaji english native }
        coverImage { large }
        status
        episodes
        season
        seasonYear
        averageScore
        synopsis: description(asHtml: false)
      }
    }
  }
  \`;

  if (!query && genreStr) {
    anilistQuery = \`
    query {
      Page(page: \${page}, perPage: \${limit}) {
        media(type: ANIME, genre: "\${genreStr}", sort: POPULARITY_DESC) {
          idMal
          title { romaji english native }
          coverImage { large }
          status
          episodes
          season
          seasonYear
          averageScore
          synopsis: description(asHtml: false)
        }
      }
    }
    \`;
  } else if (query && genreStr) {
     anilistQuery = \`
     query ($search: String) {
       Page(page: \${page}, perPage: \${limit}) {
         media(search: $search, type: ANIME, genre: "\${genreStr}", sort: POPULARITY_DESC) {
           idMal
           title { romaji english native }
           coverImage { large }
           status
           episodes
           season
           seasonYear
           averageScore
           synopsis: description(asHtml: false)
         }
       }
     }
     \`;
  }
`;

content = content.replace(
  /async function searchAnilistFallback\(query: string, page: number, limit: number\): Promise<BaseJikanAnime\[\]> \{\n  const anilistQuery = `\n  query \(\$search: String\) \{\n    Page\(page: \$\{page\}, perPage: \$\{limit\}\) \{\n      media\(search: \$search, type: ANIME\) \{\n        idMal\n        title \{ romaji english native \}\n        coverImage \{ large \}\n        status\n        episodes\n        season\n        seasonYear\n        averageScore\n        synopsis: description\(asHtml: false\)\n      \}\n    \}\n  \}\n  `;/,
  mappingCode
);

content = content.replace(
  /\} catch \(err\) \{\n    if \(clean\) \{\n      console\.warn\('\[Jikan\] Search failed, falling back to Anilist API for query:', clean\);\n      const anilistData = await searchAnilistFallback\(clean, page, limit\);\n      if \(anilistData && anilistData\.length > 0\) \{\n        return \{/,
  `} catch (err) {
    if (clean || (options.genres && options.genres !== 'all')) {
      console.warn('[Jikan] Search failed, falling back to Anilist API. Query:', clean, 'Genre:', options.genres);
      const anilistData = await searchAnilistFallback(clean, page, limit, options.genres);
      if (anilistData && anilistData.length > 0) {
        return {`
);

fs.writeFileSync('server/jikanService.ts', content);
