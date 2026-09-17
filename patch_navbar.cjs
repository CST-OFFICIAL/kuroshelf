const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// 1. Hide the inline search bar on small mobile, make it wider on desktop
code = code.replace(
  'className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-sm ml-auto"',
  'className="hidden sm:flex items-center gap-2 flex-1 max-w-sm md:max-w-md lg:max-w-lg ml-auto"'
);

// 2. Add search bar into the mobile drawer
const targetDrawer = `{/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 pt-2 pb-4 space-y-1">`;
        
const replacementDrawer = `{/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 pt-2 pb-4 space-y-1">
          {/* Mobile Search Bar */}
          <div className="mb-4 mt-2">
            <form onSubmit={(e) => { setMobileMenuOpen(false); handleSearchSubmit(e); }} className="relative w-full flex items-center">
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400">
                <Search className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Search anime by title..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg pl-10 pr-8 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
              {searchQuery && (
                <button type="button" onClick={() => { onSearchChange(''); onSearchSubmit(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 p-1">✕</button>
              )}
            </form>
          </div>`;

code = code.replace(targetDrawer, replacementDrawer);

fs.writeFileSync('src/components/Navbar.tsx', code);
