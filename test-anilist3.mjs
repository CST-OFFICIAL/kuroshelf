async function searchAnilistFallback(query, page, limit) {
  const anilistQuery = `
  query ($search: String) {
    Page(page: ${page}, perPage: ${limit}) {
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
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: anilistQuery, variables: { search: query } })
    });
    const data = await res.json();
    
    if (!data?.data?.Page?.media) return [];
    
    return data.data.Page.media
      .filter(m => m.idMal)
      .map(m => {
        let status = 'Finished Airing';
        if (m.status === 'RELEASING') status = 'Currently Airing';
        if (m.status === 'NOT_YET_RELEASED') status = 'Not yet aired';

        return {
          mal_id: m.idMal,
          url: `https://myanimelist.net/anime/${m.idMal}`,
          title: m.title.romaji || m.title.english || '',
          title_english: m.title.english,
          title_japanese: m.title.native,
          images: {
            jpg: { image_url: m.coverImage.large },
            webp: { image_url: m.coverImage.large }
          },
          score: m.averageScore ? m.averageScore / 10 : null,
          episodes: m.episodes,
          status,
          year: m.seasonYear,
          synopsis: m.synopsis ? m.synopsis.replace(/<[^>]*>?/gm, '') : '',
          genres: [],
        };
      });
  } catch (err) {
    console.error('Anilist fallback error', err);
    return [];
  }
}

searchAnilistFallback('bleach', 1, 10).then(res => console.log(JSON.stringify(res, null, 2)));
