import fs from 'fs';

let content = fs.readFileSync('src/lib/supabase.ts', 'utf-8');
content = content.replace(
  /const supabaseUrl = supabaseUrlRaw\.trim\(\)\.replace\(\/\\\/rest\\\/v1\\\/\?\$\/, ''\);/,
  "const supabaseUrl = supabaseUrlRaw.trim().replace(/\\/rest\\/v1\\/?$/, '').replace(/\\/$/, '');"
);
fs.writeFileSync('src/lib/supabase.ts', content);

let serverContent = fs.readFileSync('server/supabase.ts', 'utf-8');
serverContent = serverContent.replace(
  /const supabaseUrl = supabaseUrlRaw\.trim\(\)\.replace\(\/\\\/rest\\\/v1\\\/\?\$\/, ''\);/,
  "const supabaseUrl = supabaseUrlRaw.trim().replace(/\\/rest\\/v1\\/?$/, '').replace(/\\/$/, '');"
);
fs.writeFileSync('server/supabase.ts', serverContent);
