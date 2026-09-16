const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

const fallbackCode = `
async function searchAnilistFallback(query: string, page: number, limit: number): Promise<BaseJikanAnime[]> {
  const anilistQuery = \`
  query ($search: String) {
    Page(page: \${page}, perPage: \${limit}) {
      media(search: $search, type: ANIME) {
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

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: anilistQuery, variables: { search: query } }),
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
            webp: { image_url: m.coverImage.large }
          },
          score: m.averageScore ? m.averageScore / 10 : null,
          episodes: m.episodes || null,
          status,
          year: m.seasonYear || null,
          synopsis: m.synopsis ? m.synopsis.replace(/<[^>]*>?/gm, '') : '',
          genres: [],
        };
      }) as BaseJikanAnime[];
  } catch (err) {
    console.error('Anilist fallback error', err);
    return [];
  }
}
`;

// Insert the fallback code before serverSearchAnime
content = content.replace(
  /export async function serverSearchAnime/,
  fallbackCode + '\nexport async function serverSearchAnime'
);

// Update serverSearchAnime catch block
content = content.replace(
  /  const res = await fetchFromJikan<BaseJikanAnime\[\]>\(endpoint, SEARCH_CACHE_TTL_MS\);\n\n  if \(res\.data === null\) \{\n    throw new Error\('Jikan API search unavailable'\);\n  \}\n\n  return \{\n    data: deduplicateByMalId\(Array\.isArray\(res\.data\) \? res\.data : \[\]\),\n    pagination: res\.pagination,\n  \};/,
  `  try {
    const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, SEARCH_CACHE_TTL_MS);
    if (res.data === null) {
      throw new Error('Jikan API search unavailable');
    }
    return {
      data: deduplicateByMalId(Array.isArray(res.data) ? res.data : []),
      pagination: res.pagination,
    };
  } catch (err) {
    if (clean) {
      console.warn('[Jikan] Search failed, falling back to Anilist API for query:', clean);
      const anilistData = await searchAnilistFallback(clean, page, limit);
      if (anilistData && anilistData.length > 0) {
        return {
          data: anilistData,
          pagination: {
            current_page: page,
            has_next_page: anilistData.length === limit,
            last_visible_page: page + (anilistData.length === limit ? 1 : 0),
            items: { count: anilistData.length, total: 10000, per_page: limit }
          }
        };
      }
    }
    throw err;
  }`
);

fs.writeFileSync('server/jikanService.ts', content);
