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
}

export const AnimeCard = React.memo(function AnimeCard({
  anime,
  onSelect,
  isLiked = false,
  onToggleLike,
  shelfStatus = null,
  onUpdateShelfStatus,
  rank,
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
    <div className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700 shadow-sm">
      {/* Poster Image Container */}
      <div 
        onClick={() => onSelect(anime)}
        className="relative aspect-[3/4] w-full bg-neutral-950 overflow-hidden cursor-pointer"
      >
        <MediaImage
          malId={anime.mal_id}
          images={anime.images}
          alt={anime.title}
          title={anime.title}
          mediaType="anime"
          aspectRatio="aspect-[3/4]"
          loading="lazy"
          className="w-full h-full object-cover"
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
                  : 'bg-neutral-950/85 text-neutral-200 border-neutral-700/80 backdrop-blur-sm font-semibold'
              }`}
            >
              <span className={`text-[9px] mr-0.5 ${rank <= 3 ? 'opacity-70 font-semibold' : 'text-neutral-500'}`}>#</span>
              <span className="font-mono">{rank}</span>
            </div>
          ) : anime.score ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm" title="Global Rating">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{anime.score.toFixed(1)}</span>
            </div>
          ) : (
            <div />
          )}

          {rank != null && anime.score ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-sm" title="Global Rating">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{anime.score.toFixed(1)}</span>
            </div>
          ) : anime.status ? (
            <span className="px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-700/60 text-neutral-300 font-medium text-[10px]">
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
              className={`p-1.5 rounded-lg border transition-colors ${
                isLiked
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:text-rose-400'
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
                className={`p-1.5 rounded-lg border transition-colors ${
                  shelfStatus
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                {shelfStatus ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>

              {/* Status Dropdown Menu */}
              {showStatusMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full right-0 mb-2 w-36 py-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-30"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    Add to Shelf
                  </div>
                  {statuses.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => {
                        onUpdateShelfStatus(anime, st.value);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                        shelfStatus === st.value ? 'text-rose-400 font-bold bg-neutral-800/60' : 'text-neutral-300'
                      }`}
                    >
                      <span>{st.label}</span>
                      {shelfStatus === st.value && <Check className="w-3 h-3 text-rose-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Info Area */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 
            onClick={() => onSelect(anime)}
            className="text-xs sm:text-sm font-semibold text-neutral-100 line-clamp-1 group-hover:text-rose-400 transition-colors cursor-pointer"
            title={anime.title}
          >
            {anime.title}
          </h3>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5" title={anime.title_english}>
              {anime.title_english}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
            <span>{anime.type || 'Anime'}</span>
            {anime.episodes ? <span>• {anime.episodes} eps</span> : null}
            {anime.year ? <span>• {anime.year}</span> : null}
          </div>
        </div>

        {/* Genres */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {anime.genres.slice(0, 2).map((g, i) => (
              <span
                key={g.name || `genre-${i}`}
                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-800"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
