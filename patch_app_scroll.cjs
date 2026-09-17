const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\s*\/\/ Failsafe to ensure body scrolling[\s\S]*?\}, \[selectedAnime, authModalOpen, infoModalType\]\);/;
code = code.replace(regex, '');

fs.writeFileSync('src/App.tsx', code);
