const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `      </main>

      {/* Detail Modal */}`;

const replacement = `      </main>

        {/* Right Ad - Only visible on very large screens */}
        <aside className="hidden 2xl:block w-[160px] flex-shrink-0 mt-8 mx-4 lg:mx-8">
          <div className="sticky top-24">
            <AdBanner variant="vertical" />
          </div>
        </aside>
      </div>

      {/* Detail Modal */}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
