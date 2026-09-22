import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Star, Bookmark, Search, Check, Filter, ChevronRight } from 'lucide-react';
import { AiringScheduleItem, AnimeItem, ShelfStatus } from '../types';
import { getAiringSchedule } from '../services/jikan';

interface ScheduleViewProps {
  onSelectAnime: (anime: AnimeItem) => void;
  onAddToShelf: (item: AnimeItem, status: ShelfStatus) => void;
  isItemInShelf?: (id: number) => boolean;
  onNavigateTab?: (tab: string) => void;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

function getTodayWeekday(): string {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Tokyo' }).toLowerCase();
  return DAYS_OF_WEEK.some(d => d.id === day) ? day : 'monday';
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Aired recently';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  onSelectAnime,
  onAddToShelf,
  isItemInShelf,
  onNavigateTab,
}) => {
  const todayWeekday = useMemo(() => getTodayWeekday(), []);
  const [selectedDay, setSelectedDay] = useState<string>(todayWeekday);
  const [scheduleItems, setScheduleItems] = useState<AiringScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const scheduleGridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAiringSchedule(selectedDay === 'all' ? undefined : selectedDay)
      .then((items) => {
        if (isMounted) {
          setScheduleItems(items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load schedule:', err);
        if (isMounted) {
          setScheduleItems([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDay]);

  // Extract available genres for current schedule list
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    scheduleItems.forEach((item) => {
      item.genres?.forEach((g) => {
        if (g.name) set.add(g.name);
      });
    });
    return Array.from(set).sort();
  }, [scheduleItems]);

  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchEng = item.title_english?.toLowerCase().includes(q);
        if (!matchTitle && !matchEng) return false;
      }
      if (selectedGenre !== 'all') {
        const hasGenre = item.genres?.some((g) => g.name === selectedGenre);
        if (!hasGenre) return false;
      }
      return true;
    });
  }, [scheduleItems, searchQuery, selectedGenre]);

  const handleQuickAdd = (e: React.MouseEvent, item: AiringScheduleItem) => {
    e.stopPropagation();
    onAddToShelf(item, 'watching');
    setAddedIds((prev) => new Set(prev).add(item.mal_id));
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Simulcast Broadcast Calendar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Weekly Release Schedule
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-2xl">
              Track upcoming episode broadcasts, precise countdowns, and simulcast premieres calibrated to Japan Standard Time (JST).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-auto">
            {onNavigateTab && (
              <div className="flex items-center gap-1 bg-neutral-950/80 border border-neutral-800 p-1 rounded-xl text-xs">
                <button
                  id="schedule-nav-to-seasonal"
                  type="button"
                  onClick={() => onNavigateTab('seasonal')}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                >
                  Seasonal Anime
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-neutral-700 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  <span>Schedule</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 bg-slate-100 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 px-4 py-2.5 rounded-xl text-xs text-slate-700 dark:text-neutral-300">
              <Clock className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Asia / Tokyo (JST)</div>
                <div className="text-slate-500 dark:text-neutral-500">Auto-synchronized broadcast times</div>
              </div>
            </div>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-neutral-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-neutral-800">
            {DAYS_OF_WEEK.map((day) => {
              const isToday = day.id === todayWeekday;
              const isSelected = selectedDay === day.id;

              return (
                <button
                  key={day.id}
                  id={`schedule-day-${day.id}`}
                  onClick={() => setSelectedDay(day.id)}
                  className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-semibold'
                      : 'bg-slate-100 dark:bg-neutral-950/60 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800/60'
                  }`}
                >
                  <span>{day.label}</span>
                  {isToday && (
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      Today
                    </span>
                  )}
                </button>
              );
            })}
            <button
              id="schedule-day-all"
              onClick={() => setSelectedDay('all')}
              className={`shrink-0 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                selectedDay === 'all'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-semibold'
                  : 'bg-slate-100 dark:bg-neutral-950/60 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800/60'
              }`}
            >
              All Week
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800/80 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-500" />
          <input
            id="schedule-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${selectedDay !== 'all' ? selectedDay : 'weekly'} releases...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {availableGenres.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 dark:text-neutral-500 shrink-0" />
            <select
              id="schedule-genre-filter"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs text-slate-800 dark:text-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Genres ({scheduleItems.length})</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className={scheduleGridClass}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden animate-pulse h-80 flex flex-col"
            >
              <div className="h-48 bg-neutral-800/60" />
              <div className="p-4 space-y-3 flex-1">
                <div className="h-4 bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-800/50 rounded w-1/2" />
                <div className="h-6 bg-neutral-800/40 rounded mt-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-neutral-800/50 p-8 space-y-3">
          <Calendar className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Airing Releases Found</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            {searchQuery
              ? `No titles match "${searchQuery}" for this filter.`
              : `No scheduled simulcast episodes recorded for ${selectedDay}. Check back soon or select another day!`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline font-medium"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className={scheduleGridClass}>
          {filteredItems.map((item) => {
            const airing = item.airing_schedule;
            const inShelf = isItemInShelf?.(item.mal_id) || addedIds.has(item.mal_id);
            const countdown = airing?.time_until_airing ? formatCountdown(airing.time_until_airing) : null;

            return (
              <div
                key={item.mal_id}
                id={`schedule-card-${item.mal_id}`}
                onClick={() => onSelectAnime(item)}
                className="group relative bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-rose-500/50 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-rose-600/10 dark:hover:shadow-rose-950/20 hover:-translate-y-1"
              >
                {/* Poster & Badges */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-neutral-950">
                  <img
                    src={item.images?.jpg?.image_url || item.images?.webp?.image_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    {airing?.episode ? (
                      <span className="px-2 py-1 rounded-md bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                        Ep {airing.episode}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-neutral-800/90 backdrop-blur-md text-neutral-300 text-[11px] font-medium">
                        {item.type || 'TV'}
                      </span>
                    )}

                    {item.score ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md text-amber-400 text-[11px] font-bold border border-neutral-800/80">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {item.score.toFixed(2)}
                      </span>
                    ) : null}
                  </div>

                  {/* Airing Time Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
                    {airing?.airing_time && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-950/85 backdrop-blur-md text-neutral-300 font-mono text-[11px] border border-neutral-800/60">
                        <Clock className="w-3 h-3 text-rose-400" />
                        {airing.airing_time}
                      </span>
                    )}
                    {countdown && (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        {countdown}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {item.title}
                    </h3>
                    {item.title_english && item.title_english !== item.title && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1">{item.title_english}</p>
                    )}
                  </div>

                  {/* Genres */}
                  {item.genres && item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.genres.slice(0, 2).map((g) => (
                        <span
                          key={g.name}
                          className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800/80 text-[10px] text-slate-600 dark:text-neutral-400 border border-slate-200/50 dark:border-transparent"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="pt-2 border-t border-slate-200 dark:border-neutral-800/70 flex items-center justify-between gap-2">
                    <button
                      id={`schedule-add-btn-${item.mal_id}`}
                      onClick={(e) => handleQuickAdd(e, item)}
                      disabled={inShelf}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        inShelf
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-slate-100 dark:bg-neutral-800 hover:bg-rose-600 dark:hover:bg-rose-600 text-slate-700 dark:text-neutral-200 hover:text-white dark:hover:text-white'
                      }`}
                    >
                      {inShelf ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>On Shelf</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Track</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAnime(item);
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="View Details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
