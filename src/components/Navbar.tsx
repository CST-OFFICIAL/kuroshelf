import { useState, useRef, useEffect } from 'react';
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
  Crown,
  Heart,
  Megaphone,
  Tv
} from 'lucide-react';
import { AuthUser, DailyStreakInfo, ThemeMode, PortalMode } from '../types';
import { isUserDonor } from '../services/membershipService';
import { VerifiedMemberBadge } from './VerifiedMemberBadge';

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
  onToggleTheme?: () => void;
  isPremium?: boolean;
  isDonor?: boolean;
  onOpenMembershipModal?: (tab?: 'membership' | 'donate') => void;
  onOpenAnnouncements?: () => void;
  portalMode?: PortalMode;
  onPortalChange?: (portal: PortalMode) => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  shelfCount,
  searchQuery = '',
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
  onToggleTheme,
  isPremium = false,
  isDonor,
  onOpenMembershipModal,
  onOpenAnnouncements,
  portalMode = 'anime',
  onPortalChange,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const effectiveIsDonor = isDonor ?? (currentUser ? isUserDonor(currentUser.id) : isUserDonor());

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    if (searchBarOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchBarOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchBarOpen(false);
      }
    };
    if (searchBarOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchBarOpen]);

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localSearch.trim();
    if (trimmed) {
      onSearchSubmit(trimmed);
      setSearchBarOpen(false);
    }
  };

  // Dynamic Navigation Items based on the Active Portal
  const animeNavItems = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'explore', label: 'Genres', icon: Filter },
    { id: 'seasonal', label: 'This Season', icon: Sparkles },
    { id: 'rankings', label: 'Rankings', icon: Trophy },
    { id: 'advanced', label: 'Catalog', icon: Library },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'polls', label: 'Predictions', icon: Vote },
    { id: 'shelf', label: 'My Shelf', icon: Bookmark, badge: shelfCount },
  ];

  const booksNavItems = [
    { id: 'books', label: 'Discover', icon: Compass },
    { id: 'books-genres', label: 'Genres', icon: Filter },
    { id: 'books-seasons', label: 'This Season', icon: Sparkles },
    { id: 'books-rankings', label: 'Rankings', icon: Trophy },
    { id: 'books-catalog', label: 'Catalog', icon: Library },
    { id: 'books-schedule', label: 'Schedule', icon: Calendar },
    { id: 'books-polls', label: 'Predictions', icon: Vote },
    { id: 'shelf', label: 'My Shelf', icon: Bookmark, badge: shelfCount },
  ];

  const currentNavItems = portalMode === 'books' ? booksNavItems : animeNavItems;

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const handlePortalSwitch = (newPortal: PortalMode) => {
    if (onPortalChange) {
      onPortalChange(newPortal);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-[#1a202e] bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md transition-colors shadow-xs">
      {/* Top Header Panel: KUROSHELF Branding, Portal Switcher & Top Utilities */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Brand Logo & Portal Teleporter */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {/* Executive Obsidian Brand Logo */}
          <div 
            id="brand-logo"
            onClick={() => {
              if (portalMode === 'books') {
                onTabChange('books');
              } else {
                handleNavClick('home');
              }
            }}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            title="Kuro Shelf – Anime & Books Archive"
          >
            {/* Obsidian Titanium Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c2230] via-[#090b10] to-[#121622] border border-slate-700/60 dark:border-slate-700/80 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-black/50 group-hover:scale-105 group-hover:border-red-500/50 transition-all ring-1 ring-white/10">
              <span className="font-extrabold text-neutral-100 tracking-tighter">黒</span>
            </div>
            
            {/* Wordmark */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-brand font-black tracking-[-0.035em] text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-red-500 transition-colors flex items-center">
                  KURO<span className="text-red-600 dark:text-red-500 ml-0.5">SHELF</span>
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-400 -mt-0.5 font-bold">
                {portalMode === 'books' ? 'Manga & Library Archive' : 'Anime & Library Archive'}
              </span>
            </div>
          </div>

          {/* DUAL PORTAL SWITCHER: [ Anime | Library ] */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#121622] border border-slate-200 dark:border-slate-800 shadow-inner">
            <button
              type="button"
              id="portal-switch-anime"
              onClick={() => handlePortalSwitch('anime')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                portalMode === 'anime'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40 ring-1 ring-red-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
              title="Switch to Anime Portal"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Anime</span>
            </button>

            <button
              type="button"
              id="portal-switch-books"
              onClick={() => handlePortalSwitch('books')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                portalMode === 'books'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
              title="Switch to Library (Manga, Manhwa, Manhua, Novels)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Library</span>
            </button>
          </div>
        </div>

          {/* Top Header Utilities: Search, Support, Notices, Day/Night Theme, Account Switcher, Profile */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Search Trigger on Branding Bar */}
          <button
            type="button"
            id="nav-search-button"
            onClick={() => setSearchBarOpen(!searchBarOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
              searchBarOpen
                ? portalMode === 'books'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/30'
                  : 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950/30'
                : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-neutral-300'
            }`}
            title="Search"
            aria-label="Toggle search bar"
          >
            {searchBarOpen ? (
              <X className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            ) : (
              <Search className={`w-3.5 h-3.5 ${portalMode === 'books' ? 'text-emerald-500' : 'text-red-500'}`} />
            )}
            <span>{searchBarOpen ? 'Close' : 'Search'}</span>
          </button>

          {/* Kuro VIP & Support Trigger */}
          {onOpenMembershipModal && (
            <button
              type="button"
              id="nav-vip-support-button"
              onClick={() => onOpenMembershipModal(isPremium ? 'membership' : 'donate')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isPremium
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title={isPremium ? 'Kuro VIP Active' : 'Support KuroShelf & VIP'}
            >
              {isPremium ? (
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
              )}
              <span className="hidden lg:inline">
                {isPremium ? 'VIP' : 'Support'}
              </span>
            </button>
          )}

          {/* Announcements & Notices Trigger */}
          {onOpenAnnouncements && (
            <button
              type="button"
              id="nav-announcements-button"
              onClick={onOpenAnnouncements}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 text-xs font-medium transition-all cursor-pointer"
              title="Official KuroShelf Announcements & Notices"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">Notices</span>
            </button>
          )}

          {/* Day / Night 1-Click Switch Button */}
          <button
            type="button"
            id="nav-theme-toggle-button"
            onClick={() => {
              if (onToggleTheme) {
                onToggleTheme();
              } else if (onOpenAppearanceModal) {
                onOpenAppearanceModal();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            title={themeMode === 'light' ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
            aria-label="Toggle Day and Night Mode"
          >
            {themeMode === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="hidden xl:inline text-[11px] font-bold text-amber-700">Day</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/40" />
                <span className="hidden xl:inline text-[11px] font-bold text-indigo-300">Night</span>
              </>
            )}
          </button>

          {/* Account Switcher Trigger */}
          {currentUser && onOpenAccountSwitcher && (
            <button
              type="button"
              id="nav-account-switcher-button"
              onClick={onOpenAccountSwitcher}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all cursor-pointer"
              title={`Switch Accounts (${savedAccountsCount} logged in)`}
            >
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
              {savedAccountsCount > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 text-[10px] font-bold border border-red-500/30">
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
                ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-900/30'
                : currentUser
                ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-neutral-200 hover:border-red-500/50 hover:text-slate-950 dark:hover:text-white'
                : 'bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-sm'
            }`}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover border border-red-400"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
              {effectiveIsDonor && (
                <span
                  className="absolute -bottom-1 -right-1 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-600 text-white shadow-xs"
                  title="KuroShelf Generous Donator ❤️"
                >
                  <Heart className="w-1.5 h-1.5 fill-current" />
                </span>
              )}
            </div>
            <span className="truncate max-w-[110px]">
              {currentUser ? currentUser.display_name || currentUser.username : 'Sign In'}
            </span>
            {isPremium && (
              <span title="Verified Kuro VIP Member">
                <VerifiedMemberBadge size="xs" />
              </span>
            )}
            {effectiveIsDonor && (
              <span
                className="shrink-0 text-red-500 hover:scale-110 transition-transform"
                title="KuroShelf Generous Donator & Supporter ❤️"
              >
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
              </span>
            )}
          </button>
        </div>

        {/* Mobile menu & portal switch buttons */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Quick Mobile Portal Switcher */}
          <button
            type="button"
            onClick={() => handlePortalSwitch(portalMode === 'anime' ? 'books' : 'anime')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              portalMode === 'books'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-red-600 border-red-500 text-white'
            }`}
            title={`Switch to ${portalMode === 'anime' ? 'Library' : 'Anime'}`}
          >
            {portalMode === 'books' ? (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                <span>Library</span>
              </>
            ) : (
              <>
                <Tv className="w-3.5 h-3.5" />
                <span>Anime</span>
              </>
            )}
          </button>

          {/* Mobile Search Button on Branding Bar */}
          <button
            id="mobile-search-toggle"
            type="button"
            onClick={() => setSearchBarOpen(!searchBarOpen)}
            className={`p-2 rounded-xl border transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center ${
              searchBarOpen
                ? portalMode === 'books'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                  : 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950/40 ring-2 ring-red-500/30'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
            aria-label="Toggle search bar"
            title="Search"
          >
            {searchBarOpen ? (
              <X className="w-4 h-4 text-white stroke-[2.5]" />
            ) : (
              <Search className={`w-4 h-4 ${portalMode === 'books' ? 'text-emerald-500' : 'text-red-500'}`} />
            )}
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Pop-up Search Bar (Drops down directly below the Branding Bar with Smooth Backdrop) */}
      {searchBarOpen && (
        <>
          {/* Mobile Dim Backdrop with smooth fade */}
          <div
            onClick={() => setSearchBarOpen(false)}
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />

          <div
            id="navbar-search-popup"
            className="relative z-50 w-full border-b border-slate-200/90 dark:border-neutral-800 bg-white/98 dark:bg-[#0c0f17]/98 backdrop-blur-xl shadow-2xl py-3 px-3 sm:px-6 lg:px-8 transition-all animate-in slide-in-from-top-3 duration-250 ease-out"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
              <form
                onSubmit={handleSearchFormSubmit}
                className="relative flex-1 flex items-center min-w-0"
              >
                <Search
                  className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                    portalMode === 'books' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    onSearchChange(e.target.value);
                  }}
                  placeholder={
                    portalMode === 'books'
                      ? 'Search manga, manhwa, novels, authors (e.g. Solo Leveling, Berserk)...'
                      : 'Search anime, characters, studios, movies (e.g. Gojo, Mappa, AOT)...'
                  }
                  className="w-full h-11 sm:h-12 pl-10 pr-20 sm:pr-24 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-500/20 transition-all shadow-inner"
                />

                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      onSearchChange('');
                    }}
                    className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-white font-bold text-xs sm:text-sm flex items-center gap-1 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                    portalMode === 'books'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  <span>Search</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => setSearchBarOpen(false)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors active:scale-95 cursor-pointer shrink-0"
                title="Close search bar"
                aria-label="Close search bar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Descended Navigation Tabs Panel */}
      <div className="hidden md:block w-full border-t border-slate-200/80 dark:border-[#161c28] bg-slate-50/95 dark:bg-[#07090e]/95 backdrop-blur-md">
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav 
            aria-label="Main Navigation Tabs"
            className="flex items-center gap-1 sm:gap-2 py-1.5 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'books' && activeTab === 'books-all');
              
              const activeColorClass = portalMode === 'books'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                : 'bg-red-600 text-white shadow-sm shadow-red-950/20 ring-1 ring-red-500/30';

              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none shrink-0 ${
                    isActive
                      ? activeColorClass
                      : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-neutral-400'}`} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full border ${
                      isActive
                        ? 'bg-white/25 text-white border-white/40'
                        : portalMode === 'books'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right indicator of active portal */}
          <div className="hidden lg:flex items-center gap-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span>
              {portalMode === 'books' ? 'Library & Books Archive' : 'Anime Discovery Platform'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0d14] px-4 pt-3 pb-4 space-y-2 transition-colors">
          {/* Mobile Portal Switcher banner */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-3">
            <button
              type="button"
              onClick={() => handlePortalSwitch('anime')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                portalMode === 'anime'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Anime Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('books')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                portalMode === 'books'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Library Portal</span>
            </button>
          </div>

          {/* Mobile Direct Search Bar */}
          {portalMode === 'anime' && !['profile', 'advanced', 'polls', 'admin', 'rankings', 'shelf'].includes(activeTab) && !activeTab.startsWith('books') && onSearchSubmit && onSearchChange && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  onSearchSubmit(searchQuery.trim());
                  setMobileMenuOpen(false);
                }
              }}
              className="relative flex items-center mb-2"
            >
              <Search className="absolute left-3 w-4 h-4 text-red-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search anime..."
                className="w-full min-w-0 h-10 pl-9 pr-20 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 truncate text-ellipsis overflow-hidden"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-md text-xs font-bold transition-transform cursor-pointer"
              >
                Search
              </button>
            </form>
          )}

          {/* Mobile Appearance & Theme Button */}
          {onOpenAppearanceModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAppearanceModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 mb-2"
            >
              <div className="flex items-center gap-3">
                {themeMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Laptop className="w-4 h-4 text-red-500" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                {themeMode}
              </span>
            </button>
          )}

          {/* Mobile Auth Button */}
          <button
            onClick={() => {
              currentUser ? onTabChange('profile') : onOpenAuth();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 flex items-center justify-center">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-red-400"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-red-400" />
                )}
                {effectiveIsDonor && (
                  <span
                    className="absolute -bottom-1 -right-1 flex items-center justify-center w-3 h-3 rounded-full bg-red-600 text-white shadow-xs"
                    title="KuroShelf Generous Donator ❤️"
                  >
                    <Heart className="w-2 h-2 fill-current" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>{currentUser ? (currentUser.display_name || currentUser.username) : 'Sign In / Register'}</span>
                {isPremium && (
                  <span title="Verified Kuro VIP Member">
                    <VerifiedMemberBadge size="xs" />
                  </span>
                )}
                {effectiveIsDonor && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-500 border border-red-500/25 text-[10px] font-bold flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                    Donator
                  </span>
                )}
              </div>
            </div>
            {currentUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Mobile Streak shortcut */}
          {onOpenStreakModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStreakModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 fill-amber-400/40 text-amber-500" />
                <span>Daily Check-In Streak</span>
              </div>
              <span className="text-xs font-mono font-extrabold">{streakInfo?.currentStreak ?? 0} Days</span>
            </button>
          )}

          {/* Navigation Items list in mobile drawer */}
          <div className="space-y-1 pt-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'books' && activeTab === 'books-all');
              
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? portalMode === 'books'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${
                      portalMode === 'books' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
