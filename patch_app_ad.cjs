const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '{/* Main Content Area */}',
  `{/* Main Content Area */}\n      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">\n        <AdBanner />\n      </div>`
);

fs.writeFileSync('src/App.tsx', code);
