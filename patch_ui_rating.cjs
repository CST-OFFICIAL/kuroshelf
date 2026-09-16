const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

content = content.replace(
  /title="Global Rating"/,
  'title="True Global Rating (Aggregated MAL + AniList)"'
);

content = content.replace(
  /<span className="text-xs font-semibold text-amber-200">Global Rating<\/span>/,
  '<span className="text-xs font-semibold text-amber-200">True Global Rating</span>'
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
