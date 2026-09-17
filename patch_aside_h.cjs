const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '<aside className="hidden 2xl:block w-[160px] flex-shrink-0 mx-4 lg:mx-8 relative">',
  '<aside className="hidden 2xl:block w-[160px] flex-shrink-0 mx-4 lg:mx-8 relative h-full">'
);
code = code.replace(
  '<aside className="hidden 2xl:block w-[160px] flex-shrink-0 mx-4 lg:mx-8 relative">',
  '<aside className="hidden 2xl:block w-[160px] flex-shrink-0 mx-4 lg:mx-8 relative h-full">'
);

fs.writeFileSync('src/App.tsx', code);
