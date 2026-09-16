async function test() {
  const anilistQuery = `
    query {
      Page(page: 1, perPage: 10) {
        media(type: ANIME, genre: "Action", sort: POPULARITY_DESC) {
          idMal
          title { romaji }
        }
      }
    }
  `;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: anilistQuery, variables: { search: "" } })
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
test();
