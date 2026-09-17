const fs = require('fs');
let code = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

const target = `{/* Streaming Platform Directories */}`;
const replacement = `<div className="my-6">\n                <AdBanner />\n              </div>\n              {/* Streaming Platform Directories */}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AnimeDetailModal.tsx', code);
