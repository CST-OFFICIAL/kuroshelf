const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// I need to add back `</>` and `)}` right after `activeTab === 'shelf'` block.
const endOfShelfStr = `              />
            )}`;

const newEndOfShelfStr = `              />
            )}
          </>
        )}`;

content = content.replace(endOfShelfStr, newEndOfShelfStr);

fs.writeFileSync('src/App.tsx', content);
