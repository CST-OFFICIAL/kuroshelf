const fs = require('fs');
let content = fs.readFileSync('src/components/ExploreView.tsx', 'utf-8');

content = content.replace(
  /fetch\(\\\`\/api\/anime\/search\?\\\$\{\/g,
  "fetch(`/api/anime/search?${"
);

content = content.replace(
  /\\\`\)/g,
  "`)"
);

content = content.replace(/\\\$/g, "$");
content = content.replace(/\\`/g, "`");

fs.writeFileSync('src/components/ExploreView.tsx', content);
