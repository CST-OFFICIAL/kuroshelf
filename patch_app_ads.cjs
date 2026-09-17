const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `{/* Main Content Area */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AdBanner />
      </div>
      <main className="flex-1 w-full max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">`;

const replacement1 = `{/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto flex flex-row">
        {/* Left Ad - Only visible on very large screens */}
        <aside className="hidden 2xl:block w-[160px] 3xl:w-[200px] flex-shrink-0 mt-8 mx-4 lg:mx-8">
          <div className="sticky top-24">
            <AdBanner variant="vertical" />
          </div>
        </aside>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">`;

code = code.replace(target1, replacement1);

// We also need to close the <div className="flex-1 ... flex-row"> that we opened.
// Let's find the end of the <main> block.
const targetEndMain = `      </main>

      {/* Footer */}`;
const replacementEndMain = `      </main>

        {/* Right Ad - Only visible on very large screens */}
        <aside className="hidden 2xl:block w-[160px] 3xl:w-[200px] flex-shrink-0 mt-8 mx-4 lg:mx-8">
          <div className="sticky top-24">
            <AdBanner variant="vertical" />
          </div>
        </aside>
      </div>

      {/* Footer */}`;

code = code.replace(targetEndMain, replacementEndMain);

fs.writeFileSync('src/App.tsx', code);
