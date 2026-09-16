import { supabase } from './server/supabase';
async function test() {
  const { data, error, count } = await supabase.from('anime').select('*', { count: 'exact', head: true });
  console.log('count:', count, error);
}
test();
