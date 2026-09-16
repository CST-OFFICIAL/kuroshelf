const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The closing tags are currently just </main>
// I want to add </motion.div></AnimatePresence> BEFORE </main>.

content = content.replace(
  /      <\/main>/,
  '          </motion.div>\n        </AnimatePresence>\n      </main>'
);

fs.writeFileSync('src/App.tsx', content);
