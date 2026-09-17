const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

// Add genres to graphql queries
content = content.replace(/averageScore\s+synopsis: description\(asHtml: false\)/g, "averageScore\n           synopsis: description(asHtml: false)\n           genres");

// Map genres in response
content = content.replace(/genres: \[\],/g, "genres: (m.genres || []).map(g => ({ mal_id: 0, name: g, type: 'anime', url: '' })),");

fs.writeFileSync('server/jikanService.ts', content);
