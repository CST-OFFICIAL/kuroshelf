const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// We know the structure is:
// 1043	                    </div>
// 1044	                  )}
// 1045	
// 1046	
// 1047	                )}
// 1048	              </div>

content = content.replace(
  /                    <\/div>\n                  \)\}\n\n\n                \)\}\n              <\/div>/,
  \`                    </div>
                  )}
                  </>
                )}
              </div>\`
);

// We also need to fix the `<> {rankingFilter === 'top100'` from before
// Let's check if it exists
if (!content.includes("<>\\n                  {rankingFilter === 'top100'")) {
    // Wait, earlier I did a replace. Let's check what it looks like now.
}

fs.writeFileSync('src/App.tsx', content);
