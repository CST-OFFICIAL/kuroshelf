import { supabase } from './server/supabase';
async function test() {
  const { data, count, error } = await supabase.from('anime').select('*, anime_genres!inner(genres!inner(mal_id))', { count: 'exact' }).eq('anime_genres.genres.mal_id', 1).limit(2);
  console.log(error, data?.length);
}
test();
