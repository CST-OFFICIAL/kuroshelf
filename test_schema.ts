import { supabase } from './server/supabase.js';

async function check() {
  const { data, error } = await supabase.rpc('get_schema');
  console.log('rpc get_schema error?', error);
  // Actually, we can just insert a dummy user and see if profile is created? No, we don't have access to auth.users.
}
check();
