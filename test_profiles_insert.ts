import { supabase } from './server/supabase.js';

async function testInsert() {
  const { data, error } = await supabase.from('profiles').upsert({ id: '00000000-0000-0000-0000-000000000000', username: 'test' }).select();
  console.log('Profiles insert check:', { data, error });
}
testInsert();
