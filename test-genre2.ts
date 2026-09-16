import { supabase } from './server/supabase';
async function test() {
  const { data } = await supabase.from('anime_genres').select('*').limit(5);
  console.log('anime_genres', data);
  const { data: g } = await supabase.from('genres').select('*').limit(5);
  console.log('genres', g);
}
test();
