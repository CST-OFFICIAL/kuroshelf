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

async function searchAnilistFallback(query: string, page: number, limit: number, genreId?: string) {
  const genreStr = genreId ? GENRE_MAP[genreId] : undefined;
  
  let anilistQuery = `
  query ($search: String) {
    Page(page: ${page}, perPage: ${limit}) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        idMal
      }
    }
  }
  `;

  if (!query && genreStr) {
    anilistQuery = `
    query {
      Page(page: ${page}, perPage: ${limit}) {
        media(type: ANIME, genre: "${genreStr}", sort: POPULARITY_DESC) {
          idMal
        }
      }
    }
    `;
  }

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query: anilistQuery, variables: query ? { search: query } : {} })
  });

  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

searchAnilistFallback('', 1, 24, '36').then(console.log).catch(console.error);
