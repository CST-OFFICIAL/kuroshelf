const fs = require('fs');
let content = fs.readFileSync('src/components/HeroBanner.tsx', 'utf-8');

content = content.replace(
  /<div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">/g,
  '<div className="w-full text-xs text-rose-300/80 mb-3 font-semibold uppercase tracking-widest">\n              Kuro Shelf Exclusive Catalog\n            </div>\n            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">'
);

fs.writeFileSync('src/components/HeroBanner.tsx', content);
