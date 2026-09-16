import { supabase } from './server/supabase';
import { fetchFromJikan } from './server/jikanService';
import { ingestAnimeList } from './server/ingestionService';

async function test() {
  const data = await fetchFromJikan('/anime/59873');
  if (data && data.data) {
     const res = await ingestAnimeList([data.data]);
     console.log('Result:', res);
  } else {
     console.log('Could not fetch anime 59873');
  }
}
test();
