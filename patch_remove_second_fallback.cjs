const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /  if \(!data \|\| data\.length < limit\) \{\n    console\.log\(`\[Catalog\] Local search has \$\{data\?\.length \|\| 0\} items for page \$\{page\}, falling back to Jikan:`, clean\);\n    const jikanResult = await jikanSearch\(options\);\n    if \(jikanResult\.data && jikanResult\.data\.length > 0\) \{\n      ingestAnimeList\(jikanResult\.data\)\.catch\(err => console\.error\('Fallback ingestion error:', err\)\);\n      return \{\n        data: jikanResult\.data,\n        pagination: jikanResult\.pagination \|\| \{ last_visible_page: page \+ \(jikanResult\.data\.length === limit \? 1 : 0\), has_next_page: jikanResult\.data\.length === limit, current_page: page, items: \{ count: jikanResult\.data\.length, total: 10000, per_page: limit \} \}\n      \};\n    \}\n  \}/g,
  ""
);

fs.writeFileSync('server/catalogService.ts', content);
