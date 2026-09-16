const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

content = content.replace(
  /  if \(filter && filter !== 'all'\) \{\n    params\.set\('filter', filter\);\n  \}/,
  `  if (filter && filter !== 'all' && filter !== 'bypopularity') {
    params.set('filter', filter);
  }`
);

fs.writeFileSync('server/jikanService.ts', content);
