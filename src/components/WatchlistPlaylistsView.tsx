import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Check, 
  Bookmark, 
  ArrowRight, 
  RefreshCw, 
  Star, 
  ListPlus,
  Lock
} from 'lucide-react';
import { ShelfEntry, WatchlistPlaylist, ShelfStatus } from '../types';
import { 
  getStoredPlaylists, 
  savePlaylist, 
  deletePlaylist, 
  removeItemFromPlaylist, 
  getCurrentMonthYear, 
  generateMonthlyAiWatchlist, 
  claimAndAddMonthlyPlaylist, 
  hasClaimedMonthlyWatchlist,
  MIN_ANIME_FOR_RECOMMENDATIONS,
  getEligibleAnimeCount,
  isEligibleForMonthlyRecommendations
} from '../services/playlistService';
import { MediaImage } from './MediaImage';

interface WatchlistPlaylistsViewProps {
  shelf: ShelfEntry[];
  userId?: string;
  userName?: string;
  onSelectMedia: (id: number, mediaType: 'anime' | 'manga') => void;
  onAddToShelf: (item: { id: number; mediaType: 'anime' | 'manga'; title: string; image: string }, status: ShelfStatus) => void;
}

export function WatchlistPlaylistsView({
  shelf,
  userId,
  userName,
  onSelectMedia,
  onAddToShelf,
}: WatchlistPlaylistsViewProps) {
  const [playlists, setPlaylists] = useState<WatchlistPlaylist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<WatchlistPlaylist | null>(null);
  const [monthlyDrop, setMonthlyDrop] = useState<WatchlistPlaylist | null>(null);
  const [isMonthlyClaimed, setIsMonthlyClaimed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [addedItemIds, setAddedItemIds] = useState<Set<number>>(new Set());

  const monthYear = getCurrentMonthYear();
  const eligibleCount = getEligibleAnimeCount(shelf);
  const isEligible = isEligibleForMonthlyRecommendations(shelf);
  const remainingNeeded = Math.max(0, MIN_ANIME_FOR_RECOMMENDATIONS - eligibleCount);
  const watchingCount = shelf.filter((s) => s.mediaType === 'anime' && s.status === 'watching').length;
  const planToWatchCount = shelf.filter((s) => s.mediaType === 'anime' && s.status === 'plan_to_watch').length;
  const completedCount = shelf.filter((s) => s.mediaType === 'anime' && s.status === 'completed').length;

  useEffect(() => {
    // Load stored playlists
    const stored = getStoredPlaylists(userId);
    setPlaylists(stored);

    // Generate monthly AI watchlist if eligible
    if (isEligible) {
      const generated = generateMonthlyAiWatchlist(shelf, monthYear, userName);
      setMonthlyDrop(generated);
      const claimed = hasClaimedMonthlyWatchlist(monthYear, userId);
      setIsMonthlyClaimed(claimed);
    } else {
      setMonthlyDrop(null);
    }
  }, [shelf, userId, userName, monthYear, isEligible]);

  const handleClaimMonthly = () => {
    if (!monthlyDrop) return;
    claimAndAddMonthlyPlaylist(monthlyDrop, userId);
    setIsMonthlyClaimed(true);
    setPlaylists(getStoredPlaylists(userId));
  };

  const handleAddAllMonthlyToShelf = () => {
    if (!monthlyDrop) return;
    const newAdded = new Set(addedItemIds);
    for (const item of monthlyDrop.items) {
      onAddToShelf(item, 'plan_to_watch');
      newAdded.add(item.id);
    }
    setAddedItemIds(newAdded);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPl: WatchlistPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newTitle.trim(),
      description: newDesc.trim() || undefined,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePlaylist(newPl, userId);
    setPlaylists(getStoredPlaylists(userId));
    setNewTitle('');
    setNewDesc('');
    setCreateModalOpen(false);
  };

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this watchlist playlist?')) {
      deletePlaylist(id, userId);
      setPlaylists(getStoredPlaylists(userId));
      if (activePlaylist?.id === id) {
        setActivePlaylist(null);
      }
    }
  };

  const handleRemoveItem = (playlistId: string, itemId: number, mediaType: 'anime' | 'manga') => {
    removeItemFromPlaylist(playlistId, itemId, mediaType, userId);
    const updated = getStoredPlaylists(userId);
    setPlaylists(updated);
    if (activePlaylist && activePlaylist.id === playlistId) {
      const refreshed = updated.find((p) => p.id === playlistId) || null;
      setActivePlaylist(refreshed);
    }
  };

  const handleRegenerateMonthly = () => {
    if (!isEligible) return;
    const refreshed = generateMonthlyAiWatchlist(shelf, monthYear, userName);
    setMonthlyDrop(refreshed);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. MONTHLY WATCHLIST DROP (FOR [USER])                                   */}
      {/* ========================================================================= */}
      {isEligible && monthlyDrop ? (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-gradient-to-br from-[#1c1328] via-[#120d1c] to-[#09060f] border border-purple-500/30 shadow-2xl space-y-4 sm:space-y-6">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

          {/* Top Info Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500 text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Monthly Watchlist Drop
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  {monthYear} Edition
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                {monthlyDrop.name}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
                {monthlyDrop.description}
              </p>
            </div>

            {/* Claim / Add Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleRegenerateMonthly}
                title="Re-analyze shelf affinity for this month"
                className="p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/30 text-purple-300 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClaimMonthly}
                disabled={isMonthlyClaimed}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md ${
                  isMonthlyClaimed
                    ? 'bg-purple-900/40 border border-purple-500/30 text-purple-300 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40 hover:scale-[1.02]'
                }`}
              >
                {isMonthlyClaimed ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Watchlists</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Add Watchlist to My Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAddAllMonthlyToShelf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Add All to Shelf</span>
              </button>
            </div>
          </div>

          {/* Monthly Items Carousel / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {monthlyDrop.items.map((item) => {
              const isAddedToShelf = addedItemIds.has(item.id) || shelf.some((s) => s.id === item.id);
              return (
                <div
                  key={`monthly-drop-${item.id}`}
                  onClick={() => onSelectMedia(item.id, item.mediaType)}
                  className="group relative flex flex-col rounded-2xl bg-purple-950/40 hover:bg-purple-900/30 border border-purple-500/25 hover:border-purple-400/50 p-2.5 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Poster */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-neutral-950">
                    <MediaImage
                      src={item.image}
                      alt={item.title}
                      title={item.title}
                      mediaType={item.mediaType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white border border-white/15">
                      {item.mediaType === 'manga' ? 'Book' : 'Anime'}
                    </div>
                    {item.score && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-black shadow-xs">
                        <Star className="w-3 h-3 fill-black text-black" />
                        <span>{item.score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Reason */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-1 leading-snug">
                        {item.title}
                      </h4>
                      {item.reason && (
                        <p className="text-[10px] text-purple-200/70 font-medium line-clamp-2 mt-0.5 leading-tight">
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-purple-400 font-semibold truncate max-w-[90px]">
                        {item.genres?.[0] || 'Top Pick'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToShelf(item, 'plan_to_watch');
                          setAddedItemIds((prev) => new Set([...prev, item.id]));
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isAddedToShelf
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {isAddedToShelf ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* ========================================================================= */
        /* LOCKED STATE: Needs at least 10 anime on watchlist/watching/completed      */
        /* ========================================================================= */
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-gradient-to-br from-[#181124] via-[#100b1a] to-[#08050d] border border-purple-500/25 shadow-xl space-y-4 sm:space-y-6">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-900/60 text-purple-300 border border-purple-500/30">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  1st of Every Month Watchlist Drop
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {monthYear} Edition
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                For {userName || 'You'}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl leading-relaxed">
                Add at least <strong>10 anime</strong> to your watchlist (plan to watch), currently watching, or completed list combined to unlock your personalized recommendation drops on the 1st of every month.
              </p>
            </div>
          </div>

          {/* Progress Bar & Breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-purple-200 flex items-center gap-2">
                <span>Progress to Unlock Monthly Recommendation</span>
                <span className="text-xs font-normal text-purple-300/80">
                  ({eligibleCount} / {MIN_ANIME_FOR_RECOMMENDATIONS} anime)
                </span>
              </span>
              <span className="text-amber-400 font-extrabold">
                {remainingNeeded} more anime needed
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden border border-purple-500/30 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, (eligibleCount / MIN_ANIME_FOR_RECOMMENDATIONS) * 100)}%` }}
              />
            </div>

            {/* Status counts breakdown */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                Watching: <strong className="text-white ml-1">{watchingCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                Watchlist / Pending: <strong className="text-white ml-1">{planToWatchCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                Completed: <strong className="text-white ml-1">{completedCount}</strong>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOM USER WATCHLISTS & PLAYLISTS SECTION                             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-rose-500" />
              <span>My Custom Watchlists & Playlists</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Organize anime and manga into your own tailored watchlists (e.g. Chill Weekend, Top Tier Classics, Late Night).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-950/40 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/30 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              No custom playlists created yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
              Create your first watchlist playlist above, or click &ldquo;Add Watchlist to My Account&rdquo; on the monthly AI drop!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((pl) => {
              const previewCovers = pl.items.slice(0, 4);
              return (
                <div
                  key={pl.id}
                  onClick={() => setActivePlaylist(pl)}
                  className="group relative rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-rose-500/50 p-4 transition-all cursor-pointer shadow-xs hover:shadow-lg space-y-3"
                >
                  {/* Playlist Mosaic Header */}
                  <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-950 grid grid-cols-2 gap-1 p-1">
                    {previewCovers.length > 0 ? (
                      previewCovers.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="relative h-full overflow-hidden rounded-md bg-neutral-900">
                          <img
                            src={item.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Empty Playlist
                      </div>
                    )}
                  </div>

                  {/* Playlist info */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors truncate">
                        {pl.name}
                      </h4>
                      {pl.isAiCurated && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                          AI Drop
                        </span>
                      )}
                    </div>
                    {pl.description && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {pl.description}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium block mt-1">
                      {pl.items.length} {pl.items.length === 1 ? 'title' : 'titles'} • Updated {new Date(pl.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                    <span className="text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>View Watchlist</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeletePlaylist(pl.id, e)}
                      title="Delete Playlist"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. ACTIVE PLAYLIST EXPANDED MODAL / DRAWER                               */}
      {/* ========================================================================= */}
      {activePlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {activePlaylist.name}
                  </h3>
                  {activePlaylist.isAiCurated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      AI Curated Drop
                    </span>
                  )}
                </div>
                {activePlaylist.description && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    {activePlaylist.description}
                  </p>
                )}
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {activePlaylist.items.length} titles in this watchlist
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActivePlaylist(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Playlist Items Scrollable List */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {activePlaylist.items.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  This playlist is empty. Add anime and manga from any detail page using &ldquo;Add to Playlist&rdquo;!
                </div>
              ) : (
                activePlaylist.items.map((item) => {
                  const inShelf = shelf.some((s) => s.id === item.id);
                  return (
                    <div
                      key={`pl-item-${item.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-all"
                    >
                      <div
                        onClick={() => {
                          setActivePlaylist(null);
                          onSelectMedia(item.id, item.mediaType);
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                            {item.mediaType === 'manga' ? 'Book' : 'Anime'}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate hover:text-rose-500 transition-colors">
                            {item.title}
                          </h4>
                          {item.reason && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                              {item.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAddToShelf(item, 'plan_to_watch')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            inShelf
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {inShelf ? 'In Shelf' : '+ Add Shelf'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(activePlaylist.id, item.id, item.mediaType)}
                          title="Remove from playlist"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePlaylist(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE NEW PLAYLIST MODAL                                              */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-rose-500" />
                <span>Create Watchlist Playlist</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chill Weekend Binge, Peak Shounen..."
                  autoFocus
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What kind of titles are in this collection?"
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
