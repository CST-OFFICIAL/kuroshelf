const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

content = content.replace(
  /MAL votes/g,
  "votes"
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
