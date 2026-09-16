import { supabase } from './server/supabase';
import { ingestAnimeList } from './server/ingestionService';
import { serverSearchAnime } from './server/jikanService';

async function test() {
  const data = await serverSearchAnime({ query: "Dandadan", page: 1, limit: 1 });
  if (data && data.data && data.data.length > 0) {
     const res = await ingestAnimeList(data.data);
     console.log('Result:', res);
  } else {
     console.log('Could not fetch Dandadan');
  }
}
test();
