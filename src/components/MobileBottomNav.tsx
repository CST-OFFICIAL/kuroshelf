import { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Library,
  Trophy,
  MoreHorizontal,
  User,
  Vote,
  Calendar,
  Bookmark,
  Megaphone,
  X,
  ChevronRight,
} from 'lucide-react';
import { PortalMode, AuthUser } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  portalMode: PortalMode;
  onPortalChange?: (mode: PortalMode) => void;
  shelfCount: number;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  streakInfo?: any;
  onOpenStreakModal?: () => void;
  themeMode?: any;
  onToggleTheme?: () => void;
  onOpenAppearanceModal?: () => void;
  isPremium?: boolean;
  onOpenMembershipModal?: (tab?: any) => void;
  onOpenAnnouncements?: () => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  portalMode,
  shelfCount,
  currentUser,
  onOpenAuth,
  onOpenAnnouncements,
}: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isBooks = portalMode === 'books';

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsMoreOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const handleToggle = () => {
    if (isMoreOpen) {
      handleClose();
    } else {
      setIsMoreOpen(true);
    }
  };

  // Close sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMoreOpen) handleClose();
    };
    if (isMoreOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen, isClosing]);

  // Lock body scroll when "More" menu is open
  useEffect(() => {
    if (isMoreOpen || isClosing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen, isClosing]);

  // Tabs inside "More"
  const moreSubTabs = ['profile', 'polls', 'books-polls', 'schedule', 'books-schedule', 'shelf'];
  const isMoreActive = moreSubTabs.includes(activeTab);

  // 5 Main Bottom Tabs in exact order: Discover, This Season, Catalog, Rankings, More
  const navItems = [
    {
      id: isBooks ? 'books' : 'home',
      label: 'Discover',
      icon: Compass,
      match: (tab: string) => (isBooks ? tab === 'books' || tab === 'books-all' : tab === 'home'),
      onClick: () => {
        setIsMoreOpen(false);
        onTabChange(isBooks ? 'books' : 'home');
      },
    },
    {
      id: isBooks ? 'books-seasons' : 'seasonal',
      label: 'This Season',
      icon: Sparkles,
      match: (tab: string) => (isBooks ? tab === 'books-seasons' : tab === 'seasonal'),
      onClick: () => {
        setIsMoreOpen(false);
        onTabChange(isBooks ? 'books-seasons' : 'seasonal');
      },
    },
    {
      id: isBooks ? 'books-catalog' : 'advanced',
      label: 'Catalog',
      icon: Library,
      match: (tab: string) => (isBooks ? tab === 'books-catalog' : tab === 'advanced'),
      onClick: () => {
        setIsMoreOpen(false);
        onTabChange(isBooks ? 'books-catalog' : 'advanced');
      },
    },
    {
      id: isBooks ? 'books-rankings' : 'rankings',
      label: 'Rankings',
      icon: Trophy,
      match: (tab: string) => (isBooks ? tab === 'books-rankings' : tab === 'rankings'),
      onClick: () => {
        setIsMoreOpen(false);
        onTabChange(isBooks ? 'books-rankings' : 'rankings');
      },
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      badge: shelfCount > 0 ? (shelfCount > 99 ? '99+' : shelfCount) : undefined,
      match: () => isMoreActive || isMoreOpen,
      onClick: handleToggle,
    },
  ];

  const handleNavigate = (tab: string) => {
    handleClose();
    setTimeout(() => {
      onTabChange(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 120);
  };

  // Exactly the 5 items requested in "More": Profile, Predictions, Schedules, My Shelf, Notices
  const moreItems = [
    {
      id: 'profile',
      label: currentUser ? currentUser.display_name || currentUser.username : 'Profile & Account',
      sublabel: currentUser ? 'View profile and history' : 'Sign in to sync your library',
      icon: User,
      iconColor: isBooks ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20',
      isActive: activeTab === 'profile',
      action: () => {
        handleClose();
        setTimeout(() => {
          if (currentUser) {
            onTabChange('profile');
          } else if (onOpenAuth) {
            onOpenAuth();
          }
        }, 120);
      },
    },
    {
      id: 'predictions',
      label: 'Predictions',
      sublabel: 'Weekly matchups & community polls',
      icon: Vote,
      iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      isActive: activeTab === 'polls' || activeTab === 'books-polls',
      action: () => handleNavigate(isBooks ? 'books-polls' : 'polls'),
    },
    {
      id: 'schedules',
      label: 'Schedules',
      sublabel: 'Weekly episode & release timetable',
      icon: Calendar,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      isActive: activeTab === 'schedule' || activeTab === 'books-schedule',
      action: () => handleNavigate(isBooks ? 'books-schedule' : 'schedule'),
    },
    {
      id: 'shelf',
      label: 'My Shelf',
      sublabel: 'Personal library & watchlists',
      icon: Bookmark,
      iconColor: isBooks ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: shelfCount > 0 ? shelfCount : undefined,
      isActive: activeTab === 'shelf',
      action: () => handleNavigate('shelf'),
    },
    {
      id: 'notices',
      label: 'Notices',
      sublabel: 'Announcements & platform updates',
      icon: Megaphone,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      isActive: false,
      action: () => {
        handleClose();
        setTimeout(() => {
          onOpenAnnouncements?.();
        }, 120);
      },
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* MINIMALISTIC "MORE" ACTION SHEET WITH SMOOTH HARDWARE SLIDE-UP            */}
      {/* ========================================================================= */}
      {(isMoreOpen || isClosing) && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Subtle backdrop with smooth fade */}
          <div
            onClick={handleClose}
            className={`fixed inset-0 bg-black/65 backdrop-blur-xs ${
              isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
            }`}
            aria-hidden="true"
          />

          {/* Minimalist Floating Card with smooth slide-up */}
          <div
            className={`relative z-10 w-full bg-white dark:bg-[#0c0f17] border-t border-slate-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl overflow-hidden ${
              isClosing ? 'animate-drawer-out' : 'animate-drawer-in'
            }`}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)' }}
          >
            {/* Grabber Handle */}
            <div className="pt-2.5 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-700/80" />
            </div>

            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-neutral-800/60">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                More Options
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors active:scale-90 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Minimalist Menu Rows */}
            <div className="p-3 space-y-1.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] cursor-pointer text-left border ${
                      item.isActive
                        ? isBooks
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                          : 'bg-red-500/10 border-red-500/40 text-red-500'
                        : 'bg-slate-50/80 dark:bg-neutral-900/50 border-slate-200/80 dark:border-neutral-800/60 text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/80 active:bg-slate-200/70 dark:active:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-transform ${item.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate">
                            {item.label}
                          </span>
                          {typeof item.badge === 'number' && (
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-black rounded-full text-white shadow-xs ${
                                isBooks ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 block truncate">
                          {item.sublabel}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-TAB MOBILE BOTTOM NAVIGATION BAR                                        */}
      {/* Order: Discover, This Season, Catalog, Rankings, More                     */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md border-t border-slate-200 dark:border-neutral-800/80 shadow-lg shadow-black/30 transition-transform"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 h-14 items-center px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(activeTab);

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center h-full w-full py-1 gap-1 transition-all duration-200 cursor-pointer select-none active:scale-90 ${
                  isActive
                    ? isBooks
                      ? 'text-emerald-500 font-bold'
                      : 'text-red-500 font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 px-1 min-w-[15px] h-[15px] flex items-center justify-center text-[9px] font-black rounded-full text-white shadow-xs ${
                        isBooks ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-none tracking-tight transition-colors ${
                    isActive ? 'font-extrabold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className={`absolute top-0 w-8 h-0.5 rounded-full transition-all duration-300 ${
                      isBooks ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
