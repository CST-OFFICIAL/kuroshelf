const fs = require('fs');
let serverSupabase = fs.readFileSync('server/supabase.ts', 'utf8');
serverSupabase = serverSupabase.replace(
  "VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
  "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing."
);
fs.writeFileSync('server/supabase.ts', serverSupabase);

let clientSupabase = fs.readFileSync('src/lib/supabase.ts', 'utf8');
clientSupabase = clientSupabase.replace(
  "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.",
  "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing."
);
fs.writeFileSync('src/lib/supabase.ts', clientSupabase);
