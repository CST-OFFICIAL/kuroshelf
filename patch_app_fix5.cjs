const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /        \/>\n      \)\}\n\n      \{\/\* Footer \*\/\}/,
  '        />\n      )}\n      </AnimatePresence>\n\n      {/* Footer */}'
);

fs.writeFileSync('src/App.tsx', content);
