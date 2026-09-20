import { useState } from 'react';
import { 
  Filter,
  Compass, 
  Sparkles, 
  Trophy, 
  BookOpen, 
  Vote, 
  Bookmark, 
  Search, 
  Menu, 
  X,
  User as UserIcon,
  Library,
  Calendar,
  Flame,
  Users,
  Sun,
  Moon,
  Laptop,
  Sliders
} from 'lucide-react';
import { AuthUser, DailyStreakInfo, ThemeMode, ViewDistance } from '../types';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  shelfCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  streakInfo?: DailyStreakInfo;
  onOpenStreakModal?: () => void;
  onOpenAccountSwitcher?: () => void;
  savedAccountsCount?: number;
  themeMode?: ThemeMode;
  onOpenAppearanceModal?: () => void;
  viewDistance?: ViewDistance;
  onViewDistanceChange?: (distance: ViewDistance) => void;
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
  streakInfo,
  onOpenStreakModal,
  onOpenAccountSwitcher,
  savedAccountsCount = 1,
  themeMode = 'system',
  onOpenAppearanceModal,
  viewDistance = '85%',
  onViewDistanceChange,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'seasonal', label: 'This Season', icon: Sparkles },
    { id: 'rankings', label: 'Rankings', icon: Trophy },
    { id: 'advanced', label: 'Catalog', icon: Library },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'manga', label: 'Manga', icon: BookOpen },
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-[#202534] bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-md transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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
            <span className="font-display font-extrabold tracking-tight text-lg text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
              KURO<span className="text-rose-500 ml-0.5">SHELF</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-neutral-400 -mt-1 font-medium">
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
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-neutral-800 text-white shadow-sm border border-slate-800 dark:border-neutral-700'
                    : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400 dark:text-neutral-400'}`} />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-sm md:max-w-md lg:max-w-lg ml-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <button
              type="submit"
              id="search-submit-button"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 transition-colors"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              id="global-search-input"
              type="text"
              placeholder="Search anime by title..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-100/90 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                id="search-clear-button"
                onClick={() => {
                  onSearchChange('');
                  onSearchSubmit('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 text-xs p-1 cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </form>
          <button
            type="button"
            onClick={() => handleNavClick('explore')}
            className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300'
                : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 hover:text-slate-950 dark:hover:text-neutral-200'
            }`}
            title="Explore Genres"
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Genres</span>
          </button>
        </div>

        {/* Daily Streak, Appearance & User Account Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Quick Zoom / View Distance Switcher (85%, 90%, 100%) */}
          {onViewDistanceChange && (
            <div 
              className="flex items-center rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-0.5 text-[11px] font-semibold"
              title="Page Scale / Zoom"
            >
              <button
                type="button"
                onClick={() => onViewDistanceChange('85%')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  viewDistance === '85%' || viewDistance === 'far'
                    ? 'bg-white dark:bg-neutral-800 text-rose-500 font-bold shadow-xs'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="85% Zoom (Recommended - framed wide margins with crisp cards)"
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => onViewDistanceChange('90%')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  viewDistance === '90%'
                    ? 'bg-white dark:bg-neutral-800 text-rose-500 font-bold shadow-xs'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="90% Zoom (Balanced)"
              >
                90%
              </button>
              <button
                type="button"
                onClick={() => onViewDistanceChange('100%')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  viewDistance === '100%' || viewDistance === 'standard'
                    ? 'bg-white dark:bg-neutral-800 text-rose-500 font-bold shadow-xs'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="100% Standard 1:1 Scale"
              >
                100%
              </button>
            </div>
          )}

          {/* Appearance & View Settings Trigger */}
          {onOpenAppearanceModal && (
            <button
              type="button"
              id="nav-appearance-button"
              onClick={onOpenAppearanceModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
              title={`Screen Appearance: ${themeMode.toUpperCase()} • Scale: ${viewDistance}`}
            >
              {themeMode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : themeMode === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Laptop className="w-4 h-4 text-rose-500" />
              )}
              <span className="hidden xl:inline text-[11px] capitalize font-medium text-slate-600 dark:text-neutral-300">
                {themeMode}
              </span>
              <Sliders className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          )}

          {/* Daily Streak Trigger */}
          {onOpenStreakModal && (
            <button
              type="button"
              id="nav-daily-streak-button"
              onClick={onOpenStreakModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                streakInfo?.checkedInToday
                  ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300 hover:border-amber-400 shadow-xs'
                  : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
              title="Daily Otaku Streak"
            >
              <Flame
                className={`w-4 h-4 ${
                  streakInfo?.checkedInToday
                    ? 'text-amber-500 fill-amber-400/40 animate-pulse'
                    : 'text-amber-500 animate-bounce'
                }`}
              />
              <span className="font-mono text-xs">{streakInfo?.currentStreak ?? 0}</span>
              <span className="hidden xl:inline text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                {streakInfo?.checkedInToday ? 'Streak' : 'Check in!'}
              </span>
            </button>
          )}

          {/* Account Switcher Trigger (if logged in or accounts available) */}
          {currentUser && onOpenAccountSwitcher && (
            <button
              type="button"
              id="nav-account-switcher-button"
              onClick={onOpenAccountSwitcher}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all cursor-pointer"
              title={`Switch Accounts (${savedAccountsCount} logged in)`}
            >
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
              {savedAccountsCount > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] font-bold border border-rose-500/30">
                  {savedAccountsCount}
                </span>
              )}
            </button>
          )}

          {/* Main User Button */}
          <button
            id="nav-auth-button"
            onClick={() => currentUser ? onTabChange('profile') : onOpenAuth()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-900/30'
                : currentUser
                ? 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 hover:border-rose-500/50 hover:text-slate-950 dark:hover:text-white'
                : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500 shadow-sm'
            }`}
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt=""
                className="w-4 h-4 rounded-full object-cover border border-rose-400"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5" />
            )}
            <span className="truncate max-w-[110px]">
              {currentUser ? currentUser.display_name || currentUser.username : 'Sign In'}
            </span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 pt-2 pb-4 space-y-1 transition-colors">
          {/* Mobile Search Bar */}
          <div className="mb-4 mt-2">
            <form onSubmit={(e) => { setMobileMenuOpen(false); handleSearchSubmit(e); }} className="relative w-full flex items-center">
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-neutral-400">
                <Search className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Search anime by title..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-100 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 rounded-lg pl-10 pr-8 py-2.5 text-sm text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
              {searchQuery && (
                <button type="button" onClick={() => { onSearchChange(''); onSearchSubmit(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400 p-1">✕</button>
              )}
            </form>
          </div>

          {/* Mobile Appearance & Theme Button */}
          {onOpenAppearanceModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAppearanceModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-white border border-slate-200 dark:border-neutral-800 mb-2"
            >
              <div className="flex items-center gap-3">
                {themeMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Laptop className="w-4 h-4 text-rose-500" />
                )}
                <span>Appearance & Distance</span>
              </div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                {themeMode} • {viewDistance}
              </span>
            </button>
          )}

          {/* Mobile Auth Button */}
          <button
            onClick={() => {
              currentUser ? onTabChange('profile') : onOpenAuth();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-white border border-slate-200 dark:border-neutral-800 mb-2"
          >
            <div className="flex items-center gap-3">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-rose-400"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-rose-400" />
              )}
              <span>{currentUser ? (currentUser.display_name || currentUser.username) : 'Sign In / Register'}</span>
            </div>
            {currentUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Mobile Streak & Switcher shortcuts */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {onOpenStreakModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStreakModal();
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-bold text-amber-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <Flame className="w-4 h-4 fill-amber-400/40 text-amber-500" />
                <span>{streakInfo?.currentStreak ?? 0} Day Streak</span>
              </button>
            )}

            {currentUser && onOpenAccountSwitcher && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccountSwitcher();
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <Users className="w-4 h-4 text-rose-500" />
                <span>Switch ({savedAccountsCount})</span>
              </button>
            )}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                    : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
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
