const query = `
query ($search: String) {
  Page(page: 1, perPage: 1) {
    media(search: $search, type: ANIME) {
      idMal
    }
  }
}
`;
fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables: { search: "bleach" } })
}).then(r => r.json()).then(data => console.log(JSON.stringify(data))).catch(console.error);
