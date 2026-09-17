const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add top100 to ranking filter type
content = content.replace(
  /useState\<'bypopularity' \| 'airing' \| 'favorite' \| 'upcoming'\>\('bypopularity'\)/g,
  "useState<'bypopularity' | 'airing' | 'favorite' | 'upcoming' | 'top100'>('bypopularity')"
);

// Add Top 100 filter button
const filterButtons = `
                    {[
                      { id: 'bypopularity', label: 'Popularity' },
                      { id: 'airing', label: 'Top Airing' },
                      { id: 'top100', label: 'Top 100 All-Time' },
                      { id: 'favorite', label: 'Favorites' },
                      { id: 'upcoming', label: 'Anticipated' },
                    ].map((f) => (
`;
content = content.replace(/\{\[\s+\{ id: 'bypopularity', label: 'Popularity' \},[\s\S]*?\]\.map\(\(f\) => \(/, filterButtons);

// Make the rankings list numbered
content = content.replace(
  /<AnimeCard\s+key=\{anime.mal_id\}\s+anime=\{anime\}/,
  "{/* Render numbered list for Top 100, regular cards for others */}\n                      <div key={anime.mal_id} className=\"relative\">\n                        {rankingFilter === 'top100' && (\n                          <div className=\"absolute -left-2 -top-2 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-lg z-10 border-2 border-neutral-900 shadow-rose-900/50\">\n                            {idx + 1}\n                          </div>\n                        )}\n                        <AnimeCard\n                          anime={anime}"
);

content = content.replace(
  /onUpdateShelfStatus=\{handleUpdateShelfStatus\}\n\s+\/>/,
  "onUpdateShelfStatus={handleUpdateShelfStatus}\n                        />\n                      </div>"
);

fs.writeFileSync('src/App.tsx', content);
