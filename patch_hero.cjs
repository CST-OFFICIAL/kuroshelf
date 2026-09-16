const fs = require('fs');
let content = fs.readFileSync('src/components/HeroBanner.tsx', 'utf-8');

content = content.replace(
  /Powered by Jikan API • Full catalog of 25,000\+ anime available via search/g,
  "Full catalog of 25,000+ anime available"
);

fs.writeFileSync('src/components/HeroBanner.tsx', content);
