const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const startIndex = code.indexOf('async function searchAnilistFallback');
const endIndex = code.indexOf('export async function serverSearchAnime');

const newAnilistFallback = `
const FORMAT_MAP: Record<string, string> = {
  tv: 'TV',
  movie: 'MOVIE',
  ova: 'OVA',
  ona: 'ONA',
  special: 'SPECIAL',
  music: 'MUSIC'
};

const STATUS_MAP: Record<string, string> = {
  airing: 'RELEASING',
  complete: 'FINISHED',
  upcoming: 'NOT_YET_RELEASED'
};

async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string, type?: string, statusStr?: string, orderBy?: string): Promise<BaseJikanAnime[]> {
  const genreStr = genreId && genreId !== 'all' ? GENRE_MAP[genreId] : undefined;
  const formatStr = type && type !== 'all' ? FORMAT_MAP[type.toLowerCase()] : undefined;
  const statusApi = statusStr && statusStr !== 'all' ? STATUS_MAP[statusStr.toLowerCase()] : undefined;
  
  let sort = 'POPULARITY_DESC';
  if (orderBy === 'score') sort = 'SCORE_DESC';
  else if (orderBy === 'favorites') sort = 'FAVORITES_DESC';
  else if (orderBy === 'start_date') sort = 'START_DATE_DESC';

  const anilistQuery = \`
  query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [\${sort}]) {
        idMal
        title { romaji english native }
        coverImage { large }
        status
        episodes
        season
        seasonYear
        averageScore
        synopsis: description(asHtml: false)
        genres
      }
    }
  }
  \`;

  try {
    const variables: any = { page, perPage: limit };
    if (query) variables.search = query;
    if (genreStr) variables.genre = genreStr;
    if (formatStr) variables.format = formatStr;
    if (statusApi) variables.status = statusApi;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: anilistQuery, variables }),
      signal: AbortSignal.timeout(5000)
    });
    const data = (await res.json()) as any;
    
    if (!data?.data?.Page?.media) return [];
    
    return data.data.Page.media
      .filter((m: any) => m.idMal)
      .map((m: any) => {
        let status = 'Finished Airing';
        if (m.status === 'RELEASING') status = 'Currently Airing';
        if (m.status === 'NOT_YET_RELEASED') status = 'Not yet aired';

        return {
          mal_id: m.idMal,
          url: \`https://myanimelist.net/anime/\${m.idMal}\`,
          title: m.title.romaji || m.title.english || '',
          title_english: m.title.english || null,
          title_japanese: m.title.native || null,
          images: {
            jpg: { image_url: m.coverImage.large },
            webp: { image_url: m.coverImage.large, large_image_url: m.coverImage.large }
          },
          synopsis: m.synopsis || null,
          type: formatStr || 'TV',
          episodes: m.episodes || null,
          status,
          airing: m.status === 'RELEASING',
          score: m.averageScore ? (m.averageScore / 10) : null,
          year: m.seasonYear || null,
          genres: (m.genres || []).map((g: string) => ({ mal_id: 0, type: 'anime', name: g, url: '' }))
        };
      });
  } catch (err) {
    console.warn('[Anilist Fallback] Error:', err);
    return [];
  }
}

`;

code = code.substring(0, startIndex) + newAnilistFallback + code.substring(endIndex);

// Update serverSearchAnime to always fallback
const replaceBlock = `
  } catch (err) {
    if (clean || (options.genres && options.genres !== 'all')) {
`;
const newBlock = `
  } catch (err) {
    if (true) {
`;
code = code.replace(replaceBlock, newBlock);

fs.writeFileSync('server/jikanService.ts', code);
