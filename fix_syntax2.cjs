const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The bottom of the rankingFilter ternary is around 1039-1040
// We need to replace the `)}` that matches the `) : (` with `)} </> )}`

const rankingEndStr = `                    </div>
                  )}
                )}
              </div>
            )}
            {/* 5. TAB: MANGA */}`;

const newRankingEndStr = `                    </div>
                  )}
                  </>
                )}
              </div>
            )}
            {/* 5. TAB: MANGA */}`;

content = content.replace(rankingEndStr, newRankingEndStr);

// And we need to undo the mistaken `</>` at line 1121
const mistakenEndStr = `              />
            )}
          </>
        )}
          </motion.div>`;
          
const correctEndStr = `              />
            )}
        )}
          </motion.div>`;

content = content.replace(mistakenEndStr, correctEndStr);

fs.writeFileSync('src/App.tsx', content);
