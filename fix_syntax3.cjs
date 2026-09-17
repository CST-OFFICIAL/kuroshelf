const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Use regex to match the end of the ranking tab
content = content.replace(
  /                    <\/div>\n                  \)\}\n                \)\}\n              <\/div>\n            \)\}\n            \{\/\* 5\. TAB: MANGA \*\/\}/,
  \`                    </div>
                  )}
                  </>
                )}
              </div>
            )}
            {/* 5. TAB: MANGA */}\`
);

// We still have the syntax error at the bottom of the file (lines 1119-1124).
// Let's check what the bottom of the file actually looks like.
fs.writeFileSync('src/App.tsx', content);
