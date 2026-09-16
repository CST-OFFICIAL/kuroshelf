const query = `
query ($search: String) {
  Page(page: 1, perPage: 10) {
    media(search: $search, type: ANIME) {
      id
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

const variables = { search: "bleach" };

const url = 'https://graphql.anilist.co';
const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables })
};

fetch(url, options).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
