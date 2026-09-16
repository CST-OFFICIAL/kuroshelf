const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

if (!content.includes('Filter,')) {
  content = content.replace(/import \{/, 'import { Filter,');
}

fs.writeFileSync('src/components/Navbar.tsx', content);
