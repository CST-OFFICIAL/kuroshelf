const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

// Replace the fallback query initialization
content = content.replace(
  /  let query = supabase\.from\('anime'\)\.select\('\*', \{ count: 'exact' \}\);\n\n  if \(clean\) \{/,
  `  let query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(mal_id))', { count: 'exact' });\n\n  if (options.genres && options.genres !== 'all') {\n    query = query.eq('anime_genres.genres.mal_id', Number(options.genres));\n  }\n\n  if (clean) {`
);

fs.writeFileSync('server/catalogService.ts', content);
