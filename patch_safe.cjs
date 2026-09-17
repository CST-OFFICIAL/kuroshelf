const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

// 1. Add sfw=true and genres_exclude=12,49 to Jikan serverSearchAnime
code = code.replace(/if \(clean\) params\.set\('q', clean\);/, "if (clean) params.set('q', clean);\n  params.set('sfw', 'true');\n  params.set('genres_exclude', '12,49');");

// 2. Add sfw=true to serverGetTopAnime
code = code.replace(/if \(safePage > 1\) params\.set\('page', String\(safePage\)\);/, "if (safePage > 1) params.set('page', String(safePage));\n  params.set('sfw', 'true');");

// 3. Add sfw=true to serverGetSeasonalAnime and serverGetUpcomingAnime
code = code.replace(/const endpoint = safePage > 1 \? \`\/seasons\/now\?page=\$\{safePage\}\` : \`\/seasons\/now\`;/, "const endpoint = safePage > 1 ? `/seasons/now?page=${safePage}&sfw=true` : `/seasons/now?sfw=true`;");
code = code.replace(/const endpoint = safePage > 1 \? \`\/seasons\/upcoming\?page=\$\{safePage\}\` : \`\/seasons\/upcoming\`;/, "const endpoint = safePage > 1 ? `/seasons/upcoming?page=${safePage}&sfw=true` : `/seasons/upcoming?sfw=true`;");

// 4. Update Anilist query to exclude adult content
const anilistQueryTarget = `media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [$sort]) {`;
const anilistQueryReplacement = `media(search: $search, type: ANIME, genre: $genre, format: $format, status: $status, sort: [$sort], isAdult: false, genreNotIn: ["Hentai"]) {`;
code = code.replace(anilistQueryTarget, anilistQueryReplacement);

fs.writeFileSync('server/jikanService.ts', code);
