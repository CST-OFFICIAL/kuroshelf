import { searchCatalogAnime } from './server/catalogService';
searchCatalogAnime({ limit: 24, page: 1, genres: '1' })
  .then(res => console.log('OK', res.data.length))
  .catch(err => console.error('ERROR', err));
