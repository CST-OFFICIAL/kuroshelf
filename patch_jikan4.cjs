const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

content = content.replace(
  /            headers: \{\n              'User-Agent': 'KuroShelf\/1\.0 \(\+https:\/\/kuroshelf\.app\)',\n              Accept: 'application\/json',\n            \},/,
  `            headers: {
              'User-Agent': 'KuroShelf/1.0 (+https://kuroshelf.app)',
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            },`
);

fs.writeFileSync('server/jikanService.ts', content);
