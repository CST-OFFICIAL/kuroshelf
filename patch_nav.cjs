const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// Accessibility: Add aria-current
content = content.replace(
  /id={\`nav-link-\$\{item\.id\}\`}/g,
  "id={`nav-link-${item.id}`}\n                aria-current={isActive ? 'page' : undefined}"
);

// Accessibility: add aria-current to mobile too
content = content.replace(
  /id={\`mobile-nav-\$\{item\.id\}\`}/g,
  "id={`mobile-nav-${item.id}`}\n                aria-current={isActive ? 'page' : undefined}"
);

// Rename 'Top Rankings' to 'Rankings'
content = content.replace(/label: 'Top Rankings'/g, "label: 'Rankings'");
// Rename 'Manga Shelf' to 'Manga'
content = content.replace(/label: 'Manga Shelf'/g, "label: 'Manga'");

fs.writeFileSync('src/components/Navbar.tsx', content);
