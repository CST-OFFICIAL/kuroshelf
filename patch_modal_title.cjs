const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

content = content.replace(
  /                \{\(anime\.title_japanese \|\| anime\.title_english\) && \(\n                  <p className="text-sm text-neutral-400 font-medium mt-1">\n                    \{anime\.title_japanese\} \{anime\.title_english \? \`• \$\{anime\.title_english\}\` : ''\}\n                  <\/p>\n                \)\}/,
  `                {anime.title_english && anime.title_english !== anime.title && (
                  <p className="text-sm text-neutral-300 font-medium mt-1">
                    {anime.title_english}
                  </p>
                )}
                {anime.title_japanese && (
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    {anime.title_japanese}
                  </p>
                )}`
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
