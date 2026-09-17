import { searchCatalogAnime } from './server/catalogService';

async function run() {
  const res = await searchCatalogAnime({ query: '', genres: '1', limit: 1 });
  console.log("Found:", res.data.length);
  if (res.data.length > 0) {
     console.log("Genres:", res.data[0].genres);
  }
}
run();
