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
  Crown,
  Heart,
  Megaphone,
} from 'lucide-react';
import { AuthUser, DailyStreakInfo, ThemeMode } from '../types';
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
}

export function Navbar({
  activeTab,
  onTabChange,
  shelfCount,
  searchQuery: _searchQuery,
  onSearchChange: _onSearchChange,
  onSearchSubmit: _onSearchSubmit,
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
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const effectiveIsDonor = isDonor ?? (currentUser ? isUserDonor(currentUser.id) : isUserDonor());

  const navItems = [
    { id: 'home', label: 'Discover', icon: Compass },
    { id: 'explore', label: 'Genres', icon: Filter },
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-[#202534] bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-md transition-colors shadow-xs">
      {/* Top Header Panel: KUROSHELF Branding & Top Utilities */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand - Primary focus of the top panel */}
        <div 
          id="brand-logo"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-rose-950/40 group-hover:scale-105 transition-transform ring-1 ring-white/10">
            黒
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black tracking-tight text-xl text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors flex items-center gap-1">
              KURO<span className="text-rose-500 ml-0.5">SHELF</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-neutral-400 -mt-0.5 font-semibold">
              Digital Anime Library
            </span>
          </div>
        </div>

        {/* Top Header Utilities: Support, Notices, Day/Night Theme, Account Switcher, Profile */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Kuro VIP & Support Trigger */}
          {onOpenMembershipModal && (
            <button
              type="button"
              id="nav-vip-support-button"
              onClick={() => onOpenMembershipModal(isPremium ? 'membership' : 'donate')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isPremium
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300'
              }`}
              title={isPremium ? 'Kuro VIP Active' : 'Help KuroShelf Grow & VIP Membership'}
            >
              {isPremium ? (
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 text-xs font-medium transition-all cursor-pointer"
              title="Official KuroShelf Announcements & Notices"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">Notices</span>
            </button>
          )}

          {/* Day / Night 1-Click Switch Button (Positioned between Notices and Account Switch) */}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            title={themeMode === 'light' ? 'Click to switch to Night Mode (Dark)' : 'Click to switch to Day Mode (Light)'}
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
            <div className="relative shrink-0 flex items-center justify-center">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover border border-rose-400"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
              {effectiveIsDonor && (
                <span
                  className="absolute -bottom-1 -right-1 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-rose-600 text-white shadow-xs"
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
                className="shrink-0 text-rose-500 hover:scale-110 transition-transform"
                title="KuroShelf Generous Donator & Supporter ❤️ (Thank you for your donation!)"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]" />
              </span>
            )}
          </button>
        </div>

        {/* Mobile menu & search buttons */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            id="mobile-search-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 cursor-pointer flex items-center justify-center"
            aria-label="Open search"
            title="Search anime"
          >
            <Search className="w-4 h-4 text-rose-500" />
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Descended Navigation Tabs Panel - Below the panel of KUROSHELF */}
      <div className="w-full border-t border-slate-200/80 dark:border-[#1a1f2e] bg-slate-50/95 dark:bg-[#090b10]/95 backdrop-blur-md">
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
          <nav 
            aria-label="Main Navigation Tabs"
            className="flex items-center gap-1 sm:gap-2 py-1.5 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-950/20 ring-1 ring-rose-600/30'
                      : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-neutral-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-neutral-400'}`} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full border ${
                      isActive
                        ? 'bg-white/25 text-white border-white/40'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 pt-2 pb-4 space-y-1 transition-colors">
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
                <span>Appearance</span>
              </div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
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
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-white border border-slate-200 dark:border-neutral-800 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 flex items-center justify-center">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-rose-400"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-rose-400" />
                )}
                {effectiveIsDonor && (
                  <span
                    className="absolute -bottom-1 -right-1 flex items-center justify-center w-3 h-3 rounded-full bg-rose-600 text-white shadow-xs"
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
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-500 border border-rose-500/25 text-[10px] font-bold flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                    Donator
                  </span>
                )}
              </div>
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

            {onOpenMembershipModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMembershipModal(isPremium ? 'membership' : 'donate');
                }}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-colors ${
                  isPremium
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPremium ? (
                  <Crown className="w-4 h-4 text-amber-500" />
                ) : (
                  <Heart className="w-4 h-4 text-rose-500 fill-current" />
                )}
                <span>{isPremium ? 'Kuro VIP Active' : 'Support & VIP'}</span>
              </button>
            )}

            {onOpenAnnouncements && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAnnouncements();
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 text-xs font-bold text-amber-600 dark:text-amber-400"
              >
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Notices & Bulletins</span>
              </button>
            )}

            {/* Mobile 1-Click Day / Night Toggle */}
            <button
              type="button"
              id="mobile-nav-theme-toggle"
              onClick={() => {
                if (onToggleTheme) {
                  onToggleTheme();
                } else if (onOpenAppearanceModal) {
                  setMobileMenuOpen(false);
                  onOpenAppearanceModal();
                }
              }}
              className="flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 text-xs font-bold text-slate-800 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {themeMode === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Day Mode (Click for Night)</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/40" />
                  <span>Night Mode (Click for Day)</span>
                </>
              )}
            </button>
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
