const fs = require('fs');
let content = fs.readFileSync('src/services/jikan.ts', 'utf-8');

// Update Jikan service signature to allow 'top100'
content = content.replace(
  /filter: 'airing' \| 'bypopularity' \| 'favorite' \| 'upcoming' = 'bypopularity',/,
  "filter: 'airing' | 'bypopularity' | 'favorite' | 'upcoming' | 'top100' = 'bypopularity',"
);

// If filter is top100, use the new API endpoint we created
const customEndpointLogic = `
  if (filter === 'top100') {
    const res = await fetchFromApi<AnimeItem[]>('/api/anime/top100', []);
    return Array.isArray(res.data) ? res.data : [];
  }
  const res = await getTopAnimePaginated(filter, page, limit);
`;
content = content.replace(
  /const res = await getTopAnimePaginated\(filter, page, limit\);/,
  customEndpointLogic
);

fs.writeFileSync('src/services/jikan.ts', content);
