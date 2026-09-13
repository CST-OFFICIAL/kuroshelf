import { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Trophy, 
  BookOpen, 
  Vote, 
  Bookmark, 
  Search, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  shelfCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  shelfCount,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  currentUser,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'seasonal', label: 'This Season', icon: Sparkles },
    { id: 'rankings', label: 'Top Rankings', icon: Trophy },
    { id: 'manga', label: 'Manga Shelf', icon: BookOpen },
    { id: 'polls', label: 'Predictions', icon: Vote },
    { id: 'shelf', label: 'My Shelf', icon: Bookmark, badge: shelfCount },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div 
          id="brand-logo"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-extrabold shadow-md shadow-rose-950/40 group-hover:scale-105 transition-transform">
            黒
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold tracking-tight text-lg text-white group-hover:text-rose-400 transition-colors">
              KURO<span className="text-rose-500 ml-0.5">SHELF</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 -mt-1 font-medium">
              Digital Anime Library
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-sm ml-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <button
              type="submit"
              id="search-submit-button"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-rose-400 transition-colors"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              id="global-search-input"
              type="text"
              placeholder="Search anime by title, keyword..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg pl-9 pr-8 py-1.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                id="search-clear-button"
                onClick={() => {
                  onSearchChange('');
                  onSearchSubmit('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* User Account / Sign In Button */}
        <div className="hidden sm:flex items-center">
          <button
            id="nav-auth-button"
            onClick={onOpenAuth}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              currentUser
                ? 'bg-neutral-900 border-neutral-700 text-rose-300 hover:border-rose-500/50'
                : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500 shadow-sm'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="truncate max-w-[100px]">
              {currentUser ? currentUser.username : 'Sign In'}
            </span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 pt-2 pb-4 space-y-1">
          {/* Mobile Auth Button */}
          <button
            onClick={() => {
              onOpenAuth();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-neutral-900 text-white border border-neutral-800 mb-2"
          >
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-rose-400" />
              <span>{currentUser ? `Account (${currentUser.username})` : 'Sign In / Register'}</span>
            </div>
            {currentUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
