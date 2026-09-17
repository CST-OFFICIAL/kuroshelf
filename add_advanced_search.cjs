const fs = require('fs');
let navContent = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// Add Search icon to nav items if not present, let's use Database
navContent = navContent.replace(
  "import { Menu, X, Search, User as UserIcon, Bookmark, Compass, Filter, Sparkles, BookOpen, Vote, Trophy } from 'lucide-react';",
  "import { Menu, X, Search, User as UserIcon, Bookmark, Compass, Filter, Sparkles, BookOpen, Vote, Trophy, Database } from 'lucide-react';"
);

navContent = navContent.replace(
  /{ id: 'manga', label: 'Manga', icon: BookOpen },/,
  "{ id: 'advanced', label: 'Database', icon: Database },\n    { id: 'manga', label: 'Manga', icon: BookOpen },"
);

fs.writeFileSync('src/components/Navbar.tsx', navContent);

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
appContent = appContent.replace(
  "import { ExploreView } from './components/ExploreView';",
  "import { ExploreView } from './components/ExploreView';\nimport { AdvancedSearchView } from './components/AdvancedSearchView';"
);

// Add Tab
const searchTabString = `
            {/* 8. TAB: ADVANCED SEARCH */}
            {activeTab === 'advanced' && (
              <AdvancedSearchView
                onSelectAnime={setSelectedAnime}
                getShelfStatus={(id) => getShelfItem(id)?.status}
                onUpdateStatus={handleUpdateShelfStatus}
                onToggleLike={handleToggleLike}
                getIsLiked={(id) => getShelfItem(id)?.isLiked || false}
              />
            )}
            {/* 7. TAB: MY SHELF */}`;

appContent = appContent.replace("{/* 7. TAB: MY SHELF */}", searchTabString);
fs.writeFileSync('src/App.tsx', appContent);
