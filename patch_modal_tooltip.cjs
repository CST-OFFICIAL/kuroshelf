const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

// Remove MAL tooltip
content = content.replace(
  /title="MyAnimeList Global Rating"/g,
  `title="Global Rating"`
);
// Make Kuro Shelf Community Rating tooltip just "Community Rating"
content = content.replace(
  /title="Kuro Shelf Community Rating"/g,
  `title="Community Rating"`
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
