const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  `) : (
                  
                  {rankingFilter === 'top100' ? (`,
  `) : (
                  <>
                  {rankingFilter === 'top100' ? (`
);

content = content.replace(
  `                  )}
                )}
              </div>
            )}`,
  `                  )}
                  </>
                )}
              </div>
            )}`
);

fs.writeFileSync('src/App.tsx', content);
