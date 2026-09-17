const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/return \(\s*<AnimeCard/g, 'const shelfItem = getShelfItem(anime.mal_id);\n                        return (\n                          <AnimeCard');

fs.writeFileSync('src/App.tsx', code);
