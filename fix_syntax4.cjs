const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `                    </div>
                  )}
                )}
              </div>
            )}
            {/* 5. TAB: MANGA */}`;

const replace1 = `                    </div>
                  )}
                  </>
                )}
              </div>
            )}
            {/* 5. TAB: MANGA */}`;

if (content.includes(target1)) {
    content = content.replace(target1, replace1);
    console.log("Replaced target1");
} else {
    console.log("Could not find target1");
}

fs.writeFileSync('src/App.tsx', content);
