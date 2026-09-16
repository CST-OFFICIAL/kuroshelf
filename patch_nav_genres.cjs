const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// Remove 'explore' from navItems
content = content.replace(
  /    \{ id: 'explore', label: 'Explore \(Genres\)', icon: Search \},\n/,
  ''
);

// Add Filter icon import if missing
if (!content.includes('Filter,')) {
  content = content.replace(/Menu,/, 'Filter, Menu,');
}

// Add the genre button next to the search bar
content = content.replace(
  /<form onSubmit=\{handleSearchSubmit\} className="relative w-full flex items-center">/,
  `<div className="flex-1 max-w-sm sm:max-w-md mx-4 lg:mx-8 flex flex-row-reverse sm:flex-row items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">`
);

content = content.replace(
  /            \{searchQuery && \(\n              <button\n                type="button"\n                id="search-clear-button"\n                onClick=\{\(\) => onSearchChange\(''\)\}\n                className="absolute right-2\.5 top-1\/2 -translate-y-1\/2 p-1 text-neutral-500 hover:text-neutral-300 transition-colors"\n              >\n                <X className="w-3\.5 h-3\.5" \/>\n              <\/button>\n            \)\}\n          <\/form>/,
  `            {searchQuery && (
              <button
                type="button"
                id="search-clear-button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
          <button
            type="button"
            onClick={() => handleNavClick('explore')}
            className={\`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors \${
              activeTab === 'explore'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
            }\`}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Genres</span>
          </button>
        </div>`
);

// Remove the old flex container around form that is now replaced by my new one?
// Wait, what did it look like before?
