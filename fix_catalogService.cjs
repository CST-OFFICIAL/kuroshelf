const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /function mapDbToAnime\(row: any\): AnimeItem \{\n  return \{/g,
  `function mapDbToAnime(row: any): AnimeItem {
  let mappedGenres = [];
  if (row.anime_genres && Array.isArray(row.anime_genres)) {
    mappedGenres = row.anime_genres.map((ag) => ag.genres).filter(Boolean);
  }
  return {
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),`
);

content = content.replace(
  /query = supabase\.from\('anime'\)\.select\('\*, anime_genres!inner\\(genres!inner\\(mal_id\\)\\)', \{ count: 'exact' \}\);/g,
  `query = supabase.from('anime').select('*, anime_genres!inner(genres(*))', { count: 'exact' });`
);

content = content.replace(
  /query = supabase\.from\('anime'\)\.select\('\*', \{ count: 'exact' \}\);/g,
  `query = supabase.from('anime').select('*, anime_genres(genres(*))', { count: 'exact' });`
);

content = content.replace(
  /const \{ data, error \} = await supabase\.from\('anime'\)\.select\('\*'\)\.eq\('mal_id', id\)\.single\(\);/g,
  `const { data, error } = await supabase.from('anime').select('*, anime_genres(genres(*))').eq('mal_id', id).single();`
);

fs.writeFileSync('server/catalogService.ts', content);
