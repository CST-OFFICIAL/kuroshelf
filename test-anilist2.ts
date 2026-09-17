const genreStr = "Slice of Life";
const anilistQuery = `
    query {
      Page(page: 1, perPage: 24) {
        media(type: ANIME, genre: "${genreStr}", sort: POPULARITY_DESC) {
          idMal
        }
      }
    }
`;

async function run() {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query: anilistQuery, variables: { search: "" } })
  });
  console.log(await response.json());
}
run();
