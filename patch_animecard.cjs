const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeCard.tsx', 'utf-8');

content = content.replace(
  /<div className="flex items-center gap-1 px-2 py-0\.5 rounded-md bg-neutral-950\/80 backdrop-blur-md border border-amber-500\/30 text-amber-300 font-bold text-xs shadow-sm">\n              <Star className="w-3 h-3 fill-amber-400 text-amber-400" \/>\n              <span>\{anime\.score\.toFixed\(1\)\}<\/span>\n            <\/div>/,
  `<div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm" title="Global Rating">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{anime.score.toFixed(1)}</span>
            </div>`
);

fs.writeFileSync('src/components/AnimeCard.tsx', content);
