import React, { useState } from 'react';
import { AnimeItem, ShelfStatus } from '../types';
import { Star, Heart, Bookmark, Check } from 'lucide-react';
import { MediaImage } from './MediaImage';

interface AnimeCardProps {
  anime: AnimeItem;
  onSelect: (anime: AnimeItem) => void;
  isLiked?: boolean;
  onToggleLike?: (anime: AnimeItem) => void;
  shelfStatus?: ShelfStatus | null;
  onUpdateShelfStatus?: (anime: AnimeItem, status: ShelfStatus) => void;
  rank?: number;
  onSelectGenre?: (genreName: string) => void;
}

export const AnimeCard = React.memo(function AnimeCard({
  anime,
  onSelect,
  isLiked = false,
  onToggleLike,
  shelfStatus = null,
  onUpdateShelfStatus,
  rank,
  onSelectGenre,
}: AnimeCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const statuses: { value: ShelfStatus; label: string }[] = [
    { value: 'watching', label: 'Watching' },
    { value: 'plan_to_watch', label: 'Plan to Watch' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'dropped', label: 'Dropped' },
  ];

  return (
    <div className="group flex flex-col rounded-xl overflow-hidden bg-white dark:bg-[#13161f] border border-slate-200/90 dark:border-[#252b3b] hover:border-slate-300 dark:hover:border-[#3a445c] shadow-xs hover:shadow-md transition-all duration-200">
      {/* Poster Image Container */}
      <div 
        onClick={() => onSelect(anime)}
        className="relative aspect-[3/4] w-full bg-slate-100 dark:bg-[#0b0d12] overflow-hidden cursor-pointer"
      >
        <MediaImage
          malId={anime.mal_id}
          images={anime.images}
          alt={anime.title}
          title={anime.title}
          mediaType="anime"
          aspectRatio="aspect-[3/4]"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {rank != null ? (
            <div 
              className={`flex items-baseline px-2 py-0.5 rounded-md text-xs shadow-md border ${
                rank === 1
                  ? 'bg-amber-500 text-neutral-950 border-amber-300 font-extrabold'
                  : rank === 2
                  ? 'bg-slate-200 text-neutral-950 border-white font-extrabold'
                  : rank === 3
                  ? 'bg-amber-700 text-amber-100 border-amber-500/80 font-extrabold'
                  : 'bg-slate-950/85 text-slate-100 border-slate-700/80 backdrop-blur-xs font-semibold'
              }`}
            >
              <span className={`text-[9px] mr-0.5 ${rank <= 3 ? 'opacity-70 font-semibold' : 'text-slate-400'}`}>#</span>
              <span className="font-mono">{rank}</span>
            </div>
          ) : anime.score ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-amber-300 border border-amber-400/40 font-bold text-[11px] shadow-sm backdrop-blur-xs" title="Global Rating">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{anime.score.toFixed(2)}</span>
            </div>
          ) : (
            <div />
          )}

          {rank != null && anime.score ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-amber-300 border border-amber-400/40 font-bold text-[11px] shadow-sm backdrop-blur-xs" title="Global Rating">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{anime.score.toFixed(2)}</span>
            </div>
          ) : anime.status ? (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/90 text-slate-200 border border-slate-700/60 font-medium text-[10px] backdrop-blur-xs">
              {anime.status === 'Currently Airing' ? 'Airing' : anime.status}
            </span>
          ) : (
            <div />
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          {onToggleLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(anime);
              }}
              title={isLiked ? 'Unlike' : 'Favorite'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer backdrop-blur-xs ${
                isLiked
                  ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                  : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-500 hover:border-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
            </button>
          )}

          {onUpdateShelfStatus && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusMenu(!showStatusMenu);
                }}
                title="Update Shelf Status"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer backdrop-blur-xs ${
                  shelfStatus
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-500 hover:border-emerald-400'
                }`}
              >
                {shelfStatus ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>

              {/* Status Dropdown Menu */}
              {showStatusMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full right-0 mb-2 w-38 py-1 bg-white dark:bg-[#181c26] border border-slate-200 dark:border-[#2d3548] rounded-xl shadow-xl z-30"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-[#252b3b]">
                    Add to Shelf
                  </div>
                  {statuses.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => {
                        onUpdateShelfStatus(anime, st.value);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#222736] transition-colors cursor-pointer ${
                        shelfStatus === st.value 
                          ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50/60 dark:bg-rose-950/20' 
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{st.label}</span>
                      {shelfStatus === st.value && <Check className="w-3 h-3 text-rose-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Info Area */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 
            onClick={() => onSelect(anime)}
            className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug min-h-[2.4rem] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors cursor-pointer"
            title={anime.title}
          >
            {anime.title}
          </h3>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5" title={anime.title_english}>
              {anime.title_english}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{anime.type || 'Anime'}</span>
            {anime.episodes ? <span>• {anime.episodes} eps</span> : null}
            {anime.year ? <span>• {anime.year}</span> : null}
          </div>
        </div>

        {/* Genres & Tags */}
        {((anime.genres && anime.genres.length > 0) || (anime.demographics && anime.demographics.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {(anime.genres || []).slice(0, 2).map((g, i) => (
              <button
                key={g.name || `genre-${i}`}
                type="button"
                onClick={(e) => {
                  if (onSelectGenre && g.name) {
                    e.stopPropagation();
                    onSelectGenre(g.name);
                  }
                }}
                className={`inline-flex items-center text-[10px] font-medium leading-none px-2 py-1 rounded-md bg-slate-100 dark:bg-[#181c26] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#252b3b] whitespace-nowrap transition-colors ${
                  onSelectGenre ? 'hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-400/50 hover:bg-slate-200/80 dark:hover:bg-[#202634] cursor-pointer' : ''
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

