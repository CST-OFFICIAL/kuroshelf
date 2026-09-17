const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// I replaced 'const shelfItem = getShelfItem(anime.mal_id);' globally, breaking other maps. 
// I need to add it back before returning <AnimeCard and inside the top100 map.
code = code.replace(/return \(\s*<AnimeCard/g, 'const shelfItem = getShelfItem(anime.mal_id);\n                        return (\n                          <AnimeCard');
code = code.replace(/return \(\s*<div\s*key={`top100-\${anime.mal_id}-\${idx}`}/g, 'const shelfItem = getShelfItem(anime.mal_id);\n                        return (\n                          <div \n                            key={`top100-${anime.mal_id}-${idx}`}');

fs.writeFileSync('src/App.tsx', code);
