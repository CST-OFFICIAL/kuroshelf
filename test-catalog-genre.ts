import { searchCatalogAnime } from './server/catalogService';
searchCatalogAnime({ genres: '1', page: 1, limit: 10 }).then(res => console.log('success')).catch(console.error);
