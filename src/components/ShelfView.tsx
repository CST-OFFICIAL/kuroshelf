import { useState, useEffect } from 'react';
import { ShelfEntry, ShelfStatus, UserActivity } from '../types';
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
  Clock
} from 'lucide-react';
import { MediaImage } from './MediaImage';

export type ShelfViewFilterTab = 'all' | ShelfStatus | 'favorites' | 'bookmarks' | 'rated' | 'profile';

interface ShelfViewProps {
  shelf: ShelfEntry[];
  activities: UserActivity[];
  activeSubTab?: ShelfViewFilterTab;
  onSelectMedia: (id: number) => void;
  onUpdateStatus: (id: number, mediaType: 'anime' | 'manga', status: ShelfStatus) => void;
  onUpdateRating: (id: number, mediaType: 'anime' | 'manga', rating: number) => void;
  onUpdateProgress: (id: number, mediaType: 'anime' | 'manga', progress: number) => void;
  onRemove: (id: number, mediaType: 'anime' | 'manga') => void;
  onToggleLike: (id: number, mediaType: 'anime' | 'manga', title: string, image: string) => void;
  onTabChange?: (tab: ShelfViewFilterTab) => void;
}

export function ShelfView({
  shelf,
  activities,
  activeSubTab,
  onSelectMedia,
  onUpdateStatus,
  onUpdateProgress,
  onRemove,
  onToggleLike,
  onTabChange,
}: ShelfViewProps) {
  const [filterTab, setFilterTab] = useState<ShelfViewFilterTab>(activeSubTab || 'all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'anime' | 'manga'>('all');

  useEffect(() => {
    if (activeSubTab) {
      setFilterTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabClick = (tab: ShelfViewFilterTab) => {
    setFilterTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const ratedItems = shelf.filter((item) => typeof item.userRating === 'number' && item.userRating > 0);

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

  const counts = {
    all: shelf.length,
    watching: shelf.filter((i) => i.status === 'watching').length,
    plan_to_watch: shelf.filter((i) => i.status === 'plan_to_watch').length,
    completed: shelf.filter((i) => i.status === 'completed').length,
    on_hold: shelf.filter((i) => i.status === 'on_hold').length,
    dropped: shelf.filter((i) => i.status === 'dropped').length,
    favorites: shelf.filter((i) => i.isLiked).length,
    bookmarks: shelf.filter((i) => i.status === 'plan_to_watch').length,
    rated: ratedItems.length,
  };

  const totalProgressUnits = shelf.reduce((acc, item) => acc + (item.progress || 0), 0);
  const averageRating =
    ratedItems.length > 0
      ? (ratedItems.reduce((acc, item) => acc + (item.userRating || 0), 0) / ratedItems.length).toFixed(1)
      : 'N/A';

  const tabs: { id: ShelfViewFilterTab; label: string; count?: number; icon?: typeof User }[] = [
    { id: 'all', label: 'All Items', count: counts.all },
    { id: 'profile', label: 'Profile & Stats', icon: User },
    { id: 'bookmarks', label: 'Bookmarks', count: counts.bookmarks },
    { id: 'rated', label: 'Ratings', count: counts.rated },
    { id: 'watching', label: 'Watching', count: counts.watching },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'favorites', label: 'Favorites', count: counts.favorites },
    { id: 'on_hold', label: 'On Hold', count: counts.on_hold },
    { id: 'dropped', label: 'Dropped', count: counts.dropped },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Personal Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            My Kuro Shelf
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Track your watching progress, ratings, bookmarks, and favorite titles.
          </p>
        </div>

        {/* Media filter (Anime / Manga) */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start">
          {(['all', 'anime', 'manga'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMediaFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                mediaFilter === type
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {type}
            </button>
          ))}
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filterTab === tab.id
                  ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800/80 hover:bg-neutral-900 hover:text-neutral-200'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-rose-400" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterTab === tab.id ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filterTab === 'profile' ? (
        /* Profile & Library Analytics View (Product Spec Section 4 & 7) */
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-neutral-900 border border-rose-500/30 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-rose-950/40">
                黒
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-display">Local Library Profile</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Local Storage
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Your personal shelf library is stored locally in your browser. Cloud-synced profiles and account authentication will launch in Phase 3.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabClick('bookmarks')}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors border border-neutral-700"
              >
                View Bookmarks
              </button>
              <button
                onClick={() => handleTabClick('rated')}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-md shadow-rose-950/40"
              >
                View Ratings
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Total Titles</span>
                <Bookmark className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white font-display">{counts.all}</p>
              <span className="text-[10px] text-neutral-500">In personal library</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Units Logged</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white font-display">{totalProgressUnits}</p>
              <span className="text-[10px] text-neutral-500">Episodes & chapters</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Average Score</span>
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-display">
                {averageRating !== 'N/A' ? `${averageRating}/10` : '—'}
              </p>
              <span className="text-[10px] text-neutral-500">{counts.rated} titles rated</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Favorites</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-white font-display">{counts.favorites}</p>
              <span className="text-[10px] text-neutral-500">Liked anime & manga</span>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-rose-400" />
                <span>Library Status Breakdown</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                  <span className="text-neutral-300">Watching / Reading</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {counts.watching}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                  <span className="text-neutral-300">Plan to Watch / Bookmarks</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {counts.plan_to_watch}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                  <span className="text-neutral-300">Completed</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {counts.completed}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                  <span className="text-neutral-300">On Hold</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {counts.on_hold}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                  <span className="text-neutral-300">Dropped</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {counts.dropped}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity stream in profile */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <History className="w-4 h-4 text-rose-400" />
                <span>Account Activity History</span>
              </h3>
              {activities.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">
                  No activity logged yet. Add anime to your shelf or cast a prediction vote to begin tracking.
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {activities.map((act) => (
                    <div key={act.id} className="text-xs border-b border-neutral-800/60 pb-2 space-y-0.5">
                      <p className="text-neutral-300">{act.details}</p>
                      <span className="text-[10px] text-neutral-500 block">
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
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800 space-y-3">
              <Bookmark className="w-8 h-8 text-neutral-600 mx-auto" />
              <h3 className="text-base font-semibold text-neutral-300">
                No titles in this section yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore anime and manga from Discover or Seasonal and click "Add to Shelf" or the bookmark icon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={`${item.mediaType}_${item.id}`}
                  className="flex gap-4 p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 hover:border-neutral-700 transition-all group"
                >
                  {/* Poster */}
                  <div
                    onClick={() => onSelectMedia(item.id)}
                    className="shrink-0 w-24 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-950 cursor-pointer relative"
                  >
                    <MediaImage
                      malId={item.id}
                      src={item.image}
                      alt={item.title}
                      title={item.title}
                      mediaType={item.mediaType}
                      aspectRatio="aspect-[2/3]"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-black/80 text-rose-400 uppercase">
                      {item.mediaType}
                    </span>
                  </div>

                  {/* Details & Controls */}
                  <div className="flex-1 flex flex-col justify-between py-0.5 space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          onClick={() => onSelectMedia(item.id)}
                          className="text-sm font-bold text-white line-clamp-1 cursor-pointer hover:text-rose-400 transition-colors"
                        >
                          {item.title}
                        </h4>
                        <button
                          onClick={() => onToggleLike(item.id, item.mediaType, item.title, item.image)}
                          className={`p-1 rounded transition-colors ${
                            item.isLiked ? 'text-rose-500' : 'text-neutral-600 hover:text-neutral-400'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>

                      {/* Status selector */}
                      <div className="mt-1.5">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            onUpdateStatus(item.id, item.mediaType, e.target.value as ShelfStatus)
                          }
                          className="bg-neutral-950 border border-neutral-700/80 rounded-md px-2 py-0.5 text-[11px] text-neutral-300 font-medium focus:outline-none focus:border-rose-500"
                        >
                          <option value="watching">Watching</option>
                          <option value="plan_to_watch">Plan to Watch</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                          <option value="dropped">Dropped</option>
                        </select>
                      </div>
                    </div>

                    {/* Progress Counter */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400 text-[11px]">
                          {item.mediaType === 'anime' ? 'Ep.' : 'Ch.'}
                        </span>
                        <span className="font-bold text-neutral-100">{item.progress}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() =>
                              onUpdateProgress(item.id, item.mediaType, Math.max(0, item.progress - 1))
                            }
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() =>
                              onUpdateProgress(item.id, item.mediaType, item.progress + 1)
                            }
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Score display */}
                      {item.userRating ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{item.userRating}/10</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-500">Unrated</span>
                      )}

                      {/* Remove */}
                      <button
                        onClick={() => onRemove(item.id, item.mediaType)}
                        title="Remove from Shelf"
                        className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed Sidebar (Section 7) */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <History className="w-4 h-4 text-rose-400" />
            <span>Recent Activity</span>
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">
              No recent shelf activities recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 10).map((act) => (
                <div key={act.id} className="text-xs border-b border-neutral-800/60 pb-2.5 space-y-0.5">
                  <p className="text-neutral-300 leading-snug font-medium">
                    {act.details}
                  </p>
                  <span className="text-[10px] text-neutral-500 block">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
