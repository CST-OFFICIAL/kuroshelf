const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

content = content.replace(
  /<div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500\/10 border border-rose-500\/30 text-rose-300 font-bold" title="Kuro Shelf Rating">\n                      <Star className="w-4 h-4 fill-rose-400 text-rose-400" \/>\n                      <span className="text-sm">\{communityScore\.score\.toFixed\(2\)\}<\/span>/,
  `<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold" title="Kuro Shelf Rating">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-rose-400 text-rose-400" />
                        <span className="text-sm">{communityScore.score.toFixed(1)}</span>
                      </div>
                      <span className="text-xs font-semibold text-rose-200">Kuro Shelf Rating</span>`
);

content = content.replace(
  /<div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500\/10 border border-amber-500\/30 text-amber-300 font-bold" title="MAL Global Rating">\n                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" \/>\n                      <span className="text-sm">\{anime\.score\.toFixed\(2\)\}<\/span>/,
  `<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold" title="MAL Global Rating">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{anime.score.toFixed(1)}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-200">Global Rating</span>`
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
