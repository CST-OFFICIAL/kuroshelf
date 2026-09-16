const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /\{selectedAnime && \(\n        <AnimeDetailModal/g,
  '<AnimatePresence>\n      {selectedAnime && (\n        <AnimeDetailModal'
);

content = content.replace(
  /          onSelectRelatedAnime=\{handleSelectRelatedAnime\}\n        \/>\n      \)\}/g,
  '          onSelectRelatedAnime={handleSelectRelatedAnime}\n        />\n      )}\n      </AnimatePresence>'
);

fs.writeFileSync('src/App.tsx', content);
