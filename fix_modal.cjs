const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

// I'll just change the very end back to what it was
content = content.replace(
  /        <\/div>\n      <\/motion\.div>\n    <\/div>\n  \);\n\}/,
  '        </div>\n      </div>\n    </div>\n  );\n}'
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
