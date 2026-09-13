const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
async function test() {
  const { data, error } = await supabase.from('anime').select('mal_id').limit(1);
  console.log('Error:', error);
}
test();
