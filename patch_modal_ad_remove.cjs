const fs = require('fs');
let code = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

const target = `<div className="my-6">
                <AdBanner />
              </div>`;

code = code.replace(target, '');
fs.writeFileSync('src/components/AnimeDetailModal.tsx', code);
