const fs = require('fs');
let code = fs.readFileSync('server/catalogService.ts', 'utf-8');

code = code.replace(/anime_genres\(genres\(\*\)\)/g, 'anime_genres(genres(*)), anime_studios(studios(*))');
code = code.replace(/anime_genres!inner\(genres!inner\(\*\)\)/g, 'anime_genres!inner(genres!inner(*)), anime_studios(studios(*))');

fs.writeFileSync('server/catalogService.ts', code);
