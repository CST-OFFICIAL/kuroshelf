import { serverSearchAnime } from './server/jikanService';
serverSearchAnime({ orderBy: 'popularity', sort: 'asc' }).then(res => console.log(res.data.length)).catch(console.error);
