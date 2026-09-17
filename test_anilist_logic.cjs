const query = `
query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, genre: $genre, format: $format, status: $status, sort: [POPULARITY_DESC], isAdult: false, genreNotIn: ["Hentai"]) {
      idMal
      title { romaji english native }
    }
  }
}
`;
fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { search: "ramparts of ice", page: 1, perPage: 24 } })
}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)));
