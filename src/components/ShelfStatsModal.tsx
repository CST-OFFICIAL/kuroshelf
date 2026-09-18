import React, { useMemo } from 'react';
import { X, BarChart3, Clock, CheckCircle2, Star, Film, PieChart, BookOpen, Heart } from 'lucide-react';
import { ShelfEntry, ShelfStatus } from '../types';

interface ShelfStatsModalProps {
  shelf: ShelfEntry[];
  onClose: () => void;
}

const STATUS_CONFIG: Record<ShelfStatus, { label: string; color: string; bg: string }> = {
  watching: { label: 'Watching / Reading', color: 'text-amber-400', bg: 'bg-amber-400' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400' },
  plan_to_watch: { label: 'Plan to Watch', color: 'text-blue-400', bg: 'bg-blue-400' },
  on_hold: { label: 'On Hold', color: 'text-purple-400', bg: 'bg-purple-400' },
  dropped: { label: 'Dropped', color: 'text-neutral-500', bg: 'bg-neutral-500' },
};

export const ShelfStatsModal: React.FC<ShelfStatsModalProps> = ({ shelf, onClose }) => {
  const stats = useMemo(() => {
    const totalTitles = shelf.length;
    let totalEpisodes = 0;
    let ratedCount = 0;
    let scoreSum = 0;
    let favoritesCount = 0;
    let animeCount = 0;
    let mangaCount = 0;

    const statusCounts: Record<ShelfStatus, number> = {
      watching: 0,
      completed: 0,
      plan_to_watch: 0,
      on_hold: 0,
      dropped: 0,
    };

    const scoreDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
    };

    shelf.forEach((item) => {
      // Media type
      if (item.mediaType === 'manga') mangaCount++;
      else animeCount++;

      // Favorites
      if (item.isLiked) favoritesCount++;

      // Status
      if (statusCounts[item.status] !== undefined) {
        statusCounts[item.status]++;
      }

      // Progress Units (Episodes / Chapters)
      const eps = item.progress || (item.status === 'completed' ? (item.totalUnits || 12) : 0);
      totalEpisodes += eps;

      // Rating
      if (item.userRating && item.userRating > 0) {
        ratedCount++;
        scoreSum += item.userRating;
        const rounded = Math.min(Math.max(Math.round(item.userRating), 1), 10);
        scoreDistribution[rounded] = (scoreDistribution[rounded] || 0) + 1;
      }
    });

    // Time calculations: approx 23.5 mins per episode
    const totalMinutes = totalEpisodes * 23.5;
    const totalHours = Math.round(totalMinutes / 60);
    const totalDays = (totalHours / 24).toFixed(1);
    const averageScore = ratedCount > 0 ? (scoreSum / ratedCount).toFixed(2) : 'N/A';

    return {
      totalTitles,
      animeCount,
      mangaCount,
      totalEpisodes,
      totalHours,
      totalDays,
      averageScore,
      ratedCount,
      favoritesCount,
      statusCounts,
      scoreDistribution,
    };
  }, [shelf]);

  const maxScoreCount = Math.max(...Object.values(stats.scoreDistribution), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        id="shelf-stats-modal"
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Library Analytics & Statistics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Your Anime Shelf Insights</h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Overview of your watch history, viewing habits, score metrics, and taste preferences.
            </p>
          </div>

          <button
            id="close-stats-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span>Total Titles</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalTitles}</div>
              <div className="text-[10px] text-neutral-500">Tracked in your shelf</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Episodes Watched</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalEpisodes}</div>
              <div className="text-[10px] text-neutral-500">Across all series</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Time Watched</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalDays}d</div>
              <div className="text-[10px] text-neutral-500">~{stats.totalHours} hours of viewing</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Mean Score</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{stats.averageScore}</div>
              <div className="text-[10px] text-neutral-500">{stats.ratedCount} ratings recorded</div>
            </div>
          </div>

          {/* Status Breakdown Bar */}
          <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-400" />
              <span>Shelf Status Distribution</span>
            </h3>

            {/* Proportion Bar */}
            {stats.totalTitles > 0 ? (
              <div className="h-3 w-full rounded-full bg-neutral-900 overflow-hidden flex">
                {(['completed', 'watching', 'plan_to_watch', 'on_hold', 'dropped'] as ShelfStatus[]).map((st) => {
                  const count = stats.statusCounts[st];
                  if (count === 0) return null;
                  const pct = (count / stats.totalTitles) * 100;
                  return (
                    <div
                      key={st}
                      style={{ width: `${pct}%` }}
                      className={`${STATUS_CONFIG[st].bg} h-full transition-all`}
                      title={`${STATUS_CONFIG[st].label}: ${count} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            ) : null}

            {/* Status Legend & Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {(['completed', 'watching', 'plan_to_watch', 'on_hold', 'dropped'] as ShelfStatus[]).map((st) => (
                <div key={st} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[st].bg}`} />
                    <span className="text-xs text-neutral-400">{STATUS_CONFIG[st].label}</span>
                  </div>
                  <div className={`text-lg font-bold ${STATUS_CONFIG[st].color}`}>
                    {stats.statusCounts[st]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media & Library Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format Distribution */}
            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-400" />
                <span>Media Format Ratio</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      <span>Anime Titles</span>
                    </span>
                    <span className="text-neutral-400 font-mono">
                      {stats.animeCount} ({stats.totalTitles > 0 ? Math.round((stats.animeCount / stats.totalTitles) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      style={{ width: `${stats.totalTitles > 0 ? (stats.animeCount / stats.totalTitles) * 100 : 0}%` }}
                      className="h-full bg-rose-500 rounded-full transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Manga & Novels</span>
                    </span>
                    <span className="text-neutral-400 font-mono">
                      {stats.mangaCount} ({stats.totalTitles > 0 ? Math.round((stats.mangaCount / stats.totalTitles) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      style={{ width: `${stats.totalTitles > 0 ? (stats.mangaCount / stats.totalTitles) * 100 : 0}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement & Completion */}
            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Engagement & Favorites</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-neutral-900/70 border border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400 mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>Favorited</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {stats.favoritesCount}
                  </div>
                  <div className="text-[10px] text-neutral-500">Liked titles</div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900/70 border border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Finish Rate</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {stats.totalTitles > 0 ? Math.round((stats.statusCounts.completed / stats.totalTitles) * 100) : 0}%
                  </div>
                  <div className="text-[10px] text-neutral-500">Completed shelf</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Score Distribution (1-10 Stars)</span>
            </h3>

            <div className="flex items-end justify-between gap-1 sm:gap-2 h-36 pt-4 border-b border-neutral-800">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const count = stats.scoreDistribution[star] || 0;
                const heightPct = count > 0 ? Math.max((count / maxScoreCount) * 100, 10) : 4;

                return (
                  <div key={star} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {count}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all ${
                        count > 0 ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-neutral-800/40'
                      }`}
                    />
                    <span className="text-xs font-bold text-neutral-400 pt-1">
                      {star}★
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
