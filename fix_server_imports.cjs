const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

if (!content.includes('import { supabase, isSupabaseConfigured }')) {
  content = content.replace(
    "import { startBackgroundScraper } from './server/scraperDaemon';",
    "import { startBackgroundScraper } from './server/scraperDaemon';\nimport { supabase, isSupabaseConfigured } from './server/supabase';"
  );
}

if (!content.includes('serverGetTopAnime')) {
  // It might actually include it if I check carefully, let's just do a blanket check in the import block
}
// Actually, let's just use string replace on the exact jikanService block
content = content.replace(
  "serverGetSeasonalAnime,",
  "serverGetSeasonalAnime,\n  serverGetTopAnime,"
);

fs.writeFileSync('server.ts', content);
