import { useState } from 'react';
import { ShelfEntry, ShelfStatus, UserActivity } from '../types';
import { 
  Bookmark, 
  Heart, 
  Star, 
  Trash2, 
  Plus, 
  Minus, 
  History 
} from 'lucide-react';

interface ShelfViewProps {
  shelf: ShelfEntry[];
  activities: UserActivity[];
  onSelectMedia: (id: number) => void;
  onUpdateStatus: (id: number, mediaType: 'anime' | 'manga', status: ShelfStatus) => void;
  onUpdateRating: (id: number, mediaType: 'anime' | 'manga', rating: number) => void;
  onUpdateProgress: (id: number, mediaType: 'anime' | 'manga', progress: number) => void;
  onRemove: (id: number, mediaType: 'anime' | 'manga') => void;
  onToggleLike: (id: number, mediaType: 'anime' | 'manga', title: string, image: string) => void;
}

type FilterTab = 'all' | ShelfStatus | 'favorites';

export function ShelfView({
  shelf,
  activities,
  onSelectMedia,
  onUpdateStatus,
  onUpdateProgress,
  onRemove,
  onToggleLike,
}: ShelfViewProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'anime' | 'manga'>('all');

  const filteredItems = shelf.filter((item) => {
    if (mediaFilter !== 'all' && item.mediaType !== mediaFilter) {
      return false;
    }
    if (filterTab === 'favorites') {
      return item.isLiked;
    }
    if (filterTab !== 'all') {
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
  };

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Items', count: counts.all },
    { id: 'watching', label: 'Watching', count: counts.watching },
    { id: 'plan_to_watch', label: 'Plan to Watch', count: counts.plan_to_watch },
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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filterTab === tab.id
                ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800/80 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterTab === tab.id ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

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
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
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
    </div>
  );
}
