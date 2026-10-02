import { useState, useEffect } from 'react';
import { AuthUser, ShelfEntry, ShelfStatus, UserActivity } from '../types';
import { 
  Bookmark, 
  Heart, 
  Star, 
  Trash2, 
  Plus, 
  Minus, 
  History, 
  User, 
  BarChart2, 
  BarChart3, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Tv,
  BookOpen,
  Layers,
  ListPlus
} from 'lucide-react';
import { MediaImage } from './MediaImage';
import { WatchlistPlaylistsView } from './WatchlistPlaylistsView';
import { 
  getEligibleAnimeCount, 
  isEligibleForMonthlyRecommendations, 
  getCurrentMonthYear 
} from '../services/playlistService';

export type ShelfViewFilterTab = 'all' | ShelfStatus | 'favorites' | 'bookmarks' | 'rated' | 'profile' | 'watchlists';

interface ShelfViewProps {
  shelf: ShelfEntry[];
  activities: UserActivity[];
  activeSubTab?: ShelfViewFilterTab;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onSelectMedia: (id: number, mediaType: 'anime' | 'manga') => void;
  onUpdateStatus: (id: number, mediaType: 'anime' | 'manga', status: ShelfStatus) => void;
  onUpdateRating: (id: number, mediaType: 'anime' | 'manga', rating: number) => void;
  onUpdateProgress: (id: number, mediaType: 'anime' | 'manga', progress: number) => void;
  onRemove: (id: number, mediaType: 'anime' | 'manga') => void;
  onToggleLike: (id: number, mediaType: 'anime' | 'manga', title: string, image: string) => void;
  onTabChange?: (tab: ShelfViewFilterTab) => void;
  onOpenStats?: () => void;
  onOpenImportExport?: () => void;
  initialMediaFilter?: 'all' | 'anime' | 'manga';
}

export function ShelfView({
  shelf,
  activities,
  activeSubTab,
  currentUser,
  onOpenAuthModal,
  onSelectMedia,
  onUpdateStatus,
  onUpdateProgress,
  onRemove,
  onToggleLike,
  onTabChange,
  onOpenStats,
  onOpenImportExport,
  initialMediaFilter = 'all',
}: ShelfViewProps) {
  const [filterTab, setFilterTab] = useState<ShelfViewFilterTab>(activeSubTab || 'all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'anime' | 'manga'>(initialMediaFilter);

  const shelfGridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  useEffect(() => {
    if (activeSubTab) {
      setFilterTab(activeSubTab);
    }
  }, [activeSubTab]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 via-red-600/10 to-amber-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-black/40">
          <Bookmark className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Library Account Required
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
            Open Your Account to Start Making Your Library
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-300 max-w-md mx-auto leading-relaxed">
            Track both anime and books (manga, manhwa, novels), keep your chapter and episode progress synced across all your devices, and rate your favorites.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm transition-all shadow-md shadow-red-950/40 cursor-pointer"
          >
            Open Free Account / Sign In
          </button>
        </div>
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
            <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Unified Anime & Books
            </span>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              One unified shelf for all your anime episodes and book chapters.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
            <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Cross-Device Cloud Sync
            </span>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Access your library from phone, tablet, and PC.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
            <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Detailed Analytics
            </span>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Break down watch hours, read chapters, and custom ratings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleTabClick = (tab: ShelfViewFilterTab) => {
    setFilterTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const animeList = shelf.filter((item) => item.mediaType === 'anime');
  const booksList = shelf.filter((item) => item.mediaType === 'manga');

  const filteredItems = shelf.filter((item) => {
    if (mediaFilter !== 'all' && item.mediaType !== mediaFilter) {
      return false;
    }
    if (filterTab === 'favorites') {
      return item.isLiked;
    }
    if (filterTab === 'bookmarks') {
      return item.status === 'plan_to_watch';
    }
    if (filterTab === 'rated') {
      return typeof item.userRating === 'number' && item.userRating > 0;
    }
    if (filterTab !== 'all' && filterTab !== 'profile') {
      return item.status === filterTab;
    }
    return true;
  });

  const activeMediaPool = mediaFilter === 'anime' ? animeList : mediaFilter === 'manga' ? booksList : shelf;

  const counts = {
    all: activeMediaPool.length,
    watching: activeMediaPool.filter((i) => i.status === 'watching').length,
    plan_to_watch: activeMediaPool.filter((i) => i.status === 'plan_to_watch').length,
    completed: activeMediaPool.filter((i) => i.status === 'completed').length,
    on_hold: activeMediaPool.filter((i) => i.status === 'on_hold').length,
    dropped: activeMediaPool.filter((i) => i.status === 'dropped').length,
    favorites: activeMediaPool.filter((i) => i.isLiked).length,
    bookmarks: activeMediaPool.filter((i) => i.status === 'plan_to_watch').length,
    rated: activeMediaPool.filter((i) => typeof i.userRating === 'number' && i.userRating > 0).length,
  };

  const animeEpisodesLogged = animeList.reduce((acc, item) => acc + (item.progress || 0), 0);
  const bookChaptersLogged = booksList.reduce((acc, item) => acc + (item.progress || 0), 0);

  const activeRated = activeMediaPool.filter((i) => typeof i.userRating === 'number' && (i.userRating || 0) > 0);
  const averageRating =
    activeRated.length > 0
      ? (activeRated.reduce((acc, item) => acc + (item.userRating || 0), 0) / activeRated.length).toFixed(2)
      : 'N/A';

  const tabs: { id: ShelfViewFilterTab; label: string; count?: number; icon?: typeof User }[] = [
    { id: 'all', label: 'All Items', count: counts.all },
    { id: 'watchlists', label: 'Watchlists & Drops', icon: ListPlus },
    { id: 'profile', label: 'Shelf Analytics', icon: User },
    { id: 'watching', label: mediaFilter === 'manga' ? 'Reading' : mediaFilter === 'anime' ? 'Watching' : 'In Progress', count: counts.watching },
    { id: 'bookmarks', label: mediaFilter === 'manga' ? 'Plan to Read' : 'Plan to Watch', count: counts.bookmarks },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'favorites', label: 'Favorites', count: counts.favorites },
    { id: 'rated', label: 'Ratings', count: counts.rated },
    { id: 'on_hold', label: 'On Hold', count: counts.on_hold },
    { id: 'dropped', label: 'Dropped', count: counts.dropped },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section with Unified Media Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs uppercase font-bold tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Kuro Personal Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            My Kuro Shelf
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1">
            Your combined home for both anime and books (manga, manhwa, novels).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Main Media Scope Switcher: All | Anime | Books */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-inner">
            <button
              type="button"
              onClick={() => setMediaFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Shelf</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 dark:bg-black/10">
                {shelf.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMediaFilter('anime')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaFilter === 'anime'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-950/40'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-red-500'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Anime</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30">
                {animeList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMediaFilter('manga')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaFilter === 'manga'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-emerald-500'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Books</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                {booksList.length}
              </span>
            </button>
          </div>

          {/* Quick Analytics & Backup */}
          <div className="flex items-center gap-2">
            {onOpenStats && (
              <button
                id="open-shelf-stats-btn"
                onClick={onOpenStats}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="View Visual Library Analytics"
              >
                <BarChart3 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                <span>Stats</span>
              </button>
            )}

            {onOpenImportExport && (
              <button
                id="open-shelf-backup-btn"
                onClick={onOpenImportExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Backup & Migration"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Backup</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-slate-900 dark:bg-neutral-800 text-white border-slate-800 dark:border-neutral-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-neutral-950 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800/80 hover:bg-slate-200 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterTab === tab.id 
                    ? mediaFilter === 'manga' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filterTab === 'watchlists' ? (
        <WatchlistPlaylistsView
          shelf={shelf}
          userId={currentUser.id}
          userName={currentUser.display_name || currentUser.username || currentUser.email?.split('@')[0]}
          onSelectMedia={onSelectMedia}
          onAddToShelf={(item, status) => onUpdateStatus(item.id, item.mediaType, status)}
        />
      ) : filterTab === 'profile' ? (
        /* Analytics View with Dual Anime & Books Breakdown */
        <div className="space-y-6 animate-in fade-in">
          {/* User Profile Card */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c2230] to-[#0a0d14] border border-slate-700 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-black/40">
                黒
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {currentUser.display_name || currentUser.username}&apos;s Library
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Dual Archive
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Holds {animeList.length} anime series and {booksList.length} books (manga, manhwa, novels).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabClick('bookmarks')}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold transition-colors border border-slate-300 dark:border-neutral-700 cursor-pointer"
              >
                View Bookmarks
              </button>
              <button
                onClick={() => handleTabClick('rated')}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-md shadow-red-950/40 cursor-pointer"
              >
                View Ratings
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Anime Titles</span>
                <Tv className="w-4 h-4 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{animeList.length}</p>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400">{animeEpisodesLogged} episodes watched</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Book Titles</span>
                <BookOpen className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{booksList.length}</p>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400">{bookChaptersLogged} chapters read</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Average Score</span>
                <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-500 dark:text-amber-400 font-display">
                {averageRating !== 'N/A' ? `${averageRating}/10` : '—'}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400">{activeRated.length} titles rated</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Favorites</span>
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{counts.favorites}</p>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400">Liked anime & books</span>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span>Library Status Breakdown ({mediaFilter.toUpperCase()})</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80">
                  <span className="text-slate-700 dark:text-neutral-300">Watching / Reading</span>
                  <span className="font-bold text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded bg-blue-500/10">
                    {counts.watching}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80">
                  <span className="text-slate-700 dark:text-neutral-300">Plan to Watch / Read</span>
                  <span className="font-bold text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded bg-purple-500/10">
                    {counts.plan_to_watch}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80">
                  <span className="text-slate-700 dark:text-neutral-300">Completed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10">
                    {counts.completed}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80">
                  <span className="text-slate-700 dark:text-neutral-300">On Hold</span>
                  <span className="font-bold text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded bg-amber-500/10">
                    {counts.on_hold}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80">
                  <span className="text-slate-700 dark:text-neutral-300">Dropped</span>
                  <span className="font-bold text-slate-600 dark:text-neutral-400 px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800">
                    {counts.dropped}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Stream */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <History className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span>Account Activity History</span>
              </h3>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-neutral-400 py-6 text-center">
                  No activity logged yet. Add anime or books to your shelf to start tracking.
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {activities.map((act) => (
                    <div key={act.id} className="text-xs border-b border-slate-200 dark:border-neutral-800/60 pb-2 space-y-0.5">
                      <p className="text-slate-800 dark:text-neutral-300">{act.details}</p>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">
                        {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Shelf Items Grid (3 columns on lg) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Monthly AI Watchlist Drop Mini Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-neutral-900 border border-purple-500/25 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      For {currentUser.display_name || currentUser.username || 'You'} • {getCurrentMonthYear()} Watchlist Drop
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isEligibleForMonthlyRecommendations(shelf)
                        ? 'bg-purple-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}>
                      {isEligibleForMonthlyRecommendations(shelf) ? 'Ready' : `${getEligibleAnimeCount(shelf)}/10 Anime Added`}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200/70 mt-0.5">
                    {isEligibleForMonthlyRecommendations(shelf)
                      ? 'Your personalized monthly watchlist drop is ready! Click to view and add to your account.'
                      : `Add at least 10 anime to your watchlist, watching, or completed list combined to unlock monthly drops.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('watchlists')}
                className="self-start sm:self-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                {isEligibleForMonthlyRecommendations(shelf) ? 'View Drop' : 'Check Progress'}
              </button>
            </div>
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-neutral-900/40 border border-dashed border-slate-300 dark:border-neutral-800 space-y-3">
                <Bookmark className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-neutral-300">
                  No {mediaFilter === 'manga' ? 'books' : mediaFilter === 'anime' ? 'anime' : 'titles'} in this section yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                  {mediaFilter === 'manga'
                    ? 'Explore Manga, Manhwa, and Light Novels from the Books Portal and click "Add to Shelf".'
                    : 'Explore Anime from Discover or Seasonal and click "Add to Shelf".'}
                </p>
              </div>
            ) : (
              <div className={shelfGridClass}>
                {filteredItems.map((item) => {
                  const isBook = item.mediaType === 'manga';

                  return (
                    <div
                      key={`${item.mediaType}_${item.id}`}
                      className="flex gap-4 p-3.5 rounded-2xl bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 transition-all group shadow-xs"
                    >
                      {/* Poster */}
                      <div
                        onClick={() => onSelectMedia(item.id, item.mediaType)}
                        className="shrink-0 w-24 aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-950 cursor-pointer relative"
                      >
                        <MediaImage
                          malId={item.id}
                          src={item.image}
                          alt={item.title}
                          title={item.title}
                          mediaType={item.mediaType}
                          aspectRatio="aspect-[2/3]"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                          isBook 
                            ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/40' 
                            : 'bg-red-950/90 text-red-400 border border-red-800/40'
                        }`}>
                          {isBook ? 'Book' : 'Anime'}
                        </span>
                      </div>

                      {/* Details & Controls */}
                      <div className="flex-1 flex flex-col justify-between py-0.5 space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              onClick={() => onSelectMedia(item.id, item.mediaType)}
                              className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                            <button
                              type="button"
                              onClick={() => onToggleLike(item.id, item.mediaType, item.title, item.image)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                item.isLiked ? 'text-red-500' : 'text-slate-400 dark:text-neutral-600 hover:text-slate-600 dark:hover:text-neutral-400'
                              }`}
                              title={item.isLiked ? 'Favorited' : 'Add to Favorites'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                          </div>

                          {/* Status selector with adaptive vocabulary */}
                          <div className="mt-1.5">
                            <select
                              value={item.status}
                              onChange={(e) =>
                                onUpdateStatus(item.id, item.mediaType, e.target.value as ShelfStatus)
                              }
                              className="bg-slate-100 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700/80 rounded-md px-2 py-0.5 text-[11px] text-slate-800 dark:text-neutral-300 font-medium focus:outline-none focus:border-red-500"
                            >
                              <option value="watching">{isBook ? 'Reading' : 'Watching'}</option>
                              <option value="plan_to_watch">{isBook ? 'Plan to Read' : 'Plan to Watch'}</option>
                              <option value="completed">Completed</option>
                              <option value="on_hold">On Hold</option>
                              <option value="dropped">Dropped</option>
                            </select>
                          </div>
                        </div>

                        {/* Progress Counter (Episodes or Chapters) */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-800/80 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                              {isBook ? 'Ch.' : 'Ep.'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-neutral-100">{item.progress}</span>
                            <div className="flex items-center gap-0.5 ml-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateProgress(item.id, item.mediaType, Math.max(0, item.progress - 1))
                                }
                                className="p-1 rounded bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-300 cursor-pointer"
                                aria-label="Decrement progress"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateProgress(item.id, item.mediaType, item.progress + 1)
                                }
                                className="p-1 rounded bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-300 cursor-pointer"
                                aria-label="Increment progress"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* Score display */}
                          {item.userRating ? (
                            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold text-xs">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{item.userRating}/10</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-neutral-500">Unrated</span>
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => onRemove(item.id, item.mediaType)}
                            title="Remove from Shelf"
                            className="p-1 text-slate-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Feed Sidebar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <History className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span>Recent Activity</span>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-neutral-400 py-4 text-center">
                No activity logged yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activities.slice(0, 10).map((act) => (
                  <div key={act.id} className="text-xs border-b border-slate-200 dark:border-neutral-800/60 pb-2 space-y-0.5">
                    <p className="text-slate-800 dark:text-neutral-300">{act.details}</p>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 block">
                      {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
