const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

// The genre block looks like this:
const genreBlockOld = `
              {/* Genres & Themes */}
              {((anime.genres && anime.genres.length > 0) || (anime.themes && anime.themes.length > 0)) && (
                <div className="flex flex-wrap gap-2">
                  {anime.genres?.map((g) => (
                    <span
                      key={\`genre-\${g.mal_id}\`}
                      className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 font-medium"
                    >
                      {g.name}
                    </span>
                  ))}
                  {anime.themes?.map((t) => (
                    <span
                      key={\`theme-\${t.mal_id}\`}
                      className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900/60 text-neutral-400 border border-neutral-800 font-medium"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}`;

const newGenreBlockStr = `{/* Genres & Themes - Displayed immediately under the title per user request */}
                  {((anime.genres && anime.genres.length > 0) || (anime.themes && anime.themes.length > 0)) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {anime.genres?.map((g) => (
                        <span
                          key={\`genre-\${g.mal_id}\`}
                          className="px-2.5 py-0.5 text-xs rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold"
                        >
                          {g.name}
                        </span>
                      ))}
                      {anime.themes?.map((t) => (
                        <span
                          key={\`theme-\${t.mal_id}\`}
                          className="px-2.5 py-0.5 text-xs rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}`;

// Let's insert the new genre block directly after the english title inside the header/hero section of the modal.
// Then we remove the old one.

// First, clean up exact match of old genre block.
// Wait, the whitespace might differ. I'll use regex.
content = content.replace(/\{\/\* Genres & Themes \*\/\}\s*\{\(\(anime\.genres && anime\.genres\.length > 0\) \|\| \(anime\.themes && anime\.themes\.length > 0\)\)\) && \(\s*<div className="flex flex-wrap gap-2">\s*\{anime\.genres\?\.map\(\(g\) => \(\s*<span\s*key=\{`genre-\$\{g\.mal_id\}`\}\s*className="px-2\.5 py-1 text-xs rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 font-medium"\s*>\s*\{g\.name\}\s*<\/span>\s*\)\)\}\s*\{anime\.themes\?\.map\(\(t\) => \(\s*<span\s*key=\{`theme-\$\{t\.mal_id\}`\}\s*className="px-2\.5 py-1 text-xs rounded-lg bg-neutral-900\/60 text-neutral-400 border border-neutral-800 font-medium"\s*>\s*#\{t\.name\}\s*<\/span>\s*\)\)\}\s*<\/div>\s*\)\}/g, '');

const titleReplacementTarget = `{anime.title_english && anime.title_english !== anime.title && (
                    <h2 className="text-sm font-semibold text-neutral-400 leading-tight">
                      {anime.title_english}
                    </h2>
                  )}`;
                  
content = content.replace(titleReplacementTarget, titleReplacementTarget + "\n\n" + newGenreBlockStr);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
