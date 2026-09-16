const fs = require('fs');
let content = fs.readFileSync('src/components/HeroBanner.tsx', 'utf-8');

content = content.replace(
  /<div className="w-full text-xs text-neutral-400 mb-2 font-medium">\n              Full catalog of 25,000\+ anime available\n            <\/div>/g,
  ""
);

fs.writeFileSync('src/components/HeroBanner.tsx', content);
