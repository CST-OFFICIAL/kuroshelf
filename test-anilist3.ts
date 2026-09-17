import { searchCatalogAnime } from './server/catalogService';

async function run() {
  try {
    const res = await searchCatalogAnime({ genres: '36', page: 1, limit: 24, orderBy: 'popularity', sort: 'desc' });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
run();
