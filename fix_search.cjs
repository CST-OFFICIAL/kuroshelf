const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedSearchView.tsx', 'utf-8');
content = content.replace(/\\\`/g, "`");
fs.writeFileSync('src/components/AdvancedSearchView.tsx', content);
