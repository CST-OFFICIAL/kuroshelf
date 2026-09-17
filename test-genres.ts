import { searchCatalogAnime } from './server/catalogService';
async function test() {
  const result = await searchCatalogAnime({ limit: 1 });
  console.log("Genres:", result.data[0].genres);
}
test();
