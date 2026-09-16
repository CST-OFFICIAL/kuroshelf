const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeCard.tsx', 'utf-8');

content = content.replace(
  /          <\/h3>\n          <div className="flex items-center gap-1\.5 text-\[11px\] text-neutral-400 mt-1">/,
  `          </h3>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5" title={anime.title_english}>
              {anime.title_english}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">`
);

fs.writeFileSync('src/components/AnimeCard.tsx', content);
