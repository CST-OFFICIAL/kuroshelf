const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

content = content.replace(
  /  const clean = options\.query\?\.trim\(\) \|\| '';\n\n  const params = new URLSearchParams\(\);/,
  `  const clean = options.query?.trim() || '';

  if (!clean && options.orderBy === 'popularity' && (!options.genres || options.genres === 'all') && (!options.status || options.status === 'all') && (!options.type || options.type === 'all')) {
    return serverGetTopAnime('', page, limit);
  }

  const params = new URLSearchParams();`
);

fs.writeFileSync('server/jikanService.ts', content);
