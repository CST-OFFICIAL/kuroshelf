const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

content = content.replace(
  /placeholder="Search 25,000\+ anime by title..."/g,
  'placeholder="Search anime by title..."'
);

fs.writeFileSync('src/components/Navbar.tsx', content);
