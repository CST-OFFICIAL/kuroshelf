const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

content = content.replace(
  /title="Community Rating"/,
  `title="Kuro Shelf Rating"`
);

content = content.replace(
  /title="Global Rating"/,
  `title="MAL Global Rating"`
);

content = content.replace(
  /<span className="text-\[10px\] text-rose-400\/80 font-normal">\(\{communityScore\.users\} KS user\{communityScore\.users !== 1 \? 's' : ''\}\)<\/span>/,
  `<span className="text-[10px] text-rose-400/80 font-normal">({communityScore.users} KS user{communityScore.users !== 1 ? 's' : ''})</span>`
);

content = content.replace(
  /<span className="text-\[10px\] text-amber-400\/80 font-normal">\(\{anime\.scored_by\.toLocaleString\(\)\} votes\)<\/span>/,
  `<span className="text-[10px] text-amber-400/80 font-normal">({anime.scored_by.toLocaleString()} global votes)</span>`
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
