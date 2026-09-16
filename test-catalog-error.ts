import { supabase } from './server/supabase';
async function test() {
  const options = { genres: '1', page: 1, limit: 24 };
  const offset = 0;
  
  let query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(mal_id))', { count: 'exact' });
  query = query.eq('anime_genres.genres.mal_id', Number(options.genres));
  query = query.order('popularity', { ascending: true });
  query = query.range(0, 23);
  
  const { data, count, error } = await query;
  console.log('error:', error);
}
test();
