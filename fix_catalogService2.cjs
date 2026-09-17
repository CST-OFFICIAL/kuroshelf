const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /query = supabase\.from\('anime'\)\.select\('\*, anime_genres!inner\(genres!inner\(mal_id\)\)', \{ count: 'exact' \}\);/g,
  `query = supabase.from('anime').select('*, anime_genres!inner(genres(*))', { count: 'exact' });`
);

fs.writeFileSync('server/catalogService.ts', content);
