import { searchCatalogAnime } from './server/catalogService';
searchCatalogAnime({ genres: '22', page: 1, limit: 10 }).then(res => {
  console.log(`Found ${res.data.length} items`);
  if (res.data.length > 0) {
    console.log(res.data[0].title);
  }
}).catch(console.error);
