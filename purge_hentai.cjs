const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(0);

const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
  // We can't do ILIKE on a JS client if we don't have it, but we can do a broad match
  const { data, error } = await supabase.from('anime').select('id, rating, title').or('rating.ilike.%Rx%,rating.ilike.%Hentai%');
  if (data && data.length > 0) {
    const ids = data.map(d => d.id);
    await supabase.from('anime').delete().in('id', ids);
    console.log('Purged', ids.length, 'records by rating.');
  }
}
purge();
