import { supabase } from './server/supabase.js';

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles table check:', { data, error });
}
check();
