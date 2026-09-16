import { serverSearchAnime } from './server/jikanService';

serverSearchAnime({ query: 'naruto', page: 1, limit: 10 }).then(console.log).catch(console.error);
