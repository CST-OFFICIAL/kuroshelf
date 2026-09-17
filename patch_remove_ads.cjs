const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove Left Ad
const leftAdRegex = /\{\/\* Left Ad[\s\S]*?<\/aside>/;
code = code.replace(leftAdRegex, '');

// Remove Right Ad
const rightAdRegex = /\{\/\* Right Ad[\s\S]*?<\/aside>/;
code = code.replace(rightAdRegex, '');

// Clean up flex wrapper
code = code.replace(
  '<div className="flex-1 w-full max-w-[1920px] mx-auto flex flex-row justify-center">',
  '<div className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col justify-start">'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Ads removed");
