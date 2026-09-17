const query = `
query {
  Page(page: 1, perPage: 5) {
    media(search: "ramparts of ice") {
      title { romaji english native }
      type
    }
  }
}
`;
fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)));
