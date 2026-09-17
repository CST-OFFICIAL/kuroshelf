const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  "getShelfStatus={(id) => getShelfItem(id)?.status}",
  "getShelfStatus={(id) => getShelfItem(id)?.status || null}"
);

fs.writeFileSync('src/App.tsx', content);
