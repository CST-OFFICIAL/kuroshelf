const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /                <\/motion\.div>\n        <\/AnimatePresence>\n      <\/main>/,
  '          </motion.div>\n        </AnimatePresence>\n      </main>'
);

content = content.replace(
  /          \/>\n      \)\}\n      <\/AnimatePresence>/,
  '          />\n      )}\n      </AnimatePresence>'
);

fs.writeFileSync('src/App.tsx', content);
