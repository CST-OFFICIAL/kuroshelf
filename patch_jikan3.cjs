const fs = require('fs');
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

content = content.replace(
  /          console\.log\('Jikan HTTP Status:', res\.status\);/,
  `          console.log('Jikan HTTP Status:', res.status, url);`
);
fs.writeFileSync('server/jikanService.ts', content);
