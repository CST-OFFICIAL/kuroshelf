async function test() {
  const query = `
       query ($idMals: [Int]) {
         Page(page: 1, perPage: 50) {
           media(idMal_in: $idMals, type: ANIME) {
             idMal
             averageScore
           }
         }
       }
     `;
     const res = await fetch('https://graphql.anilist.co', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
       body: JSON.stringify({ query, variables: { idMals: [1, 5, 6] } })
     });
     const data = await res.json();
     console.log(JSON.stringify(data, null, 2));
}
test();
