const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /                    <\/div>\n                  \)\}\n\n\n                \)\}\n              <\/div>/,
  "                    </div>\n                  )}\n                  </>\n                )}\n              </div>"
);

fs.writeFileSync('src/App.tsx', content);
