const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = 'media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [${sort}]) {';
const replacement = 'media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [${sort}], isAdult: false, genreNotIn: ["Hentai"]) {';

code = code.replace(target, replacement);

// Also filter in the Supabase Top 100 fetch in server.ts
let serverCode = fs.readFileSync('server.ts', 'utf-8');
serverCode = serverCode.replace(
  "let query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(name))');",
  "let query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(name))').neq('rating', 'Rx - Hentai');"
);
fs.writeFileSync('server.ts', serverCode);

fs.writeFileSync('server/jikanService.ts', code);
