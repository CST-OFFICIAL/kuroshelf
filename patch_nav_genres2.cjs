const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// I'll just append the genre button after the form closing tag.
content = content.replace(
  /            \)\}\n          <\/form>/,
  `            )}\n          </form>\n          <button\n            type="button"\n            onClick={() => handleNavClick('explore')}\n            className={\`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors \${\n              activeTab === 'explore'\n                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'\n                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'\n            }\`}\n            title="Explore Genres"\n          >\n            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />\n            <span className="hidden lg:inline">Genres</span>\n          </button>`
);

fs.writeFileSync('src/components/Navbar.tsx', content);
