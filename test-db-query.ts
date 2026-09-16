import { supabase } from './server/supabase';
async function test() {
  const { data, count, error } = await supabase.from('anime').select('*, anime_genres!inner(genres!inner(mal_id))', { count: 'exact' }).eq('anime_genres.genres.mal_id', 1).limit(1);
  console.log('error:', JSON.stringify(error, null, 2));
}
test();
