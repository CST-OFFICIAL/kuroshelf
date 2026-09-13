const fs = require('fs');

// 1. Update vite.config.ts
let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
if (!viteConfig.includes('envPrefix')) {
  viteConfig = viteConfig.replace(
    'plugins: [react(), tailwindcss()],',
    "plugins: [react(), tailwindcss()],\n  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],"
  );
  fs.writeFileSync('vite.config.ts', viteConfig);
}

// 2. Update src/lib/supabase.ts
let clientSupabase = fs.readFileSync('src/lib/supabase.ts', 'utf8');
clientSupabase = clientSupabase.replace(
  'const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || \'\';',
  'const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || \'\';'
);
clientSupabase = clientSupabase.replace(
  'const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || \'\';',
  'const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || \'\';'
);
fs.writeFileSync('src/lib/supabase.ts', clientSupabase);

// 3. Update server/supabase.ts
let serverSupabase = fs.readFileSync('server/supabase.ts', 'utf8');
serverSupabase = serverSupabase.replace(
  'const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || \'\';',
  'const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || \'\';'
);
serverSupabase = serverSupabase.replace(
  'const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || \'\';',
  'const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || \'\';'
);
fs.writeFileSync('server/supabase.ts', serverSupabase);
