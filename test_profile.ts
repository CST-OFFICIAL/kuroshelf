import { supabase } from './server/supabase.js';
async function run() {
  const { data, error } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000', username: 'test' }).select();
  console.log({ error });
}
run();
