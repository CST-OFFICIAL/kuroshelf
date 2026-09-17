const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

// Fix spread order so genres isn't overwritten, and ensure name is fetched
content = content.replace(
  `genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    ...row,`,
  `...row,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),`
);

content = content.replace(
  `anime_genres!inner(genres!inner(mal_id))`,
  `anime_genres!inner(genres!inner(*))`
);

fs.writeFileSync('server/catalogService.ts', content);
