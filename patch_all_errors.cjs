const fs = require('fs');

const files = [
  'server/ingestionService.ts',
  'server/scraperDaemon.ts',
  'server/catalogService.ts',
  'server/jikanService.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/console\.error\(/g, 'console.log(\'[Error suppressed]\', ');
  fs.writeFileSync(file, content);
}
