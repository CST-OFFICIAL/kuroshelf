const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /  let query = supabase\.from\('anime'\)\.select\('\*, anime_genres!inner\(genres!inner\(mal_id\)\)', \{ count: 'exact' \}\);\n\n  if \(options\.genres && options\.genres !== 'all'\) \{\n    query = query\.eq\('anime_genres\.genres\.mal_id', Number\(options\.genres\)\);\n  \}\n\n  if \(clean\) \{/,
  `  let query;
  if (options.genres && options.genres !== 'all') {
    query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(mal_id))', { count: 'exact' });
    query = query.eq('anime_genres.genres.mal_id', Number(options.genres));
  } else {
    query = supabase.from('anime').select('*', { count: 'exact' });
  }

  if (clean) {`
);

fs.writeFileSync('server/catalogService.ts', content);
