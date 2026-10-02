import { AnimeItem, ShelfStatus } from '../types';
import { BookOpen, Bookmark, Check, Star, Calendar, Clock, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cleanSynopsis } from '../utils/textUtils';

interface HeroBannerProps {
  anime: AnimeItem | null;
  onSelect: (anime: AnimeItem) => void;
  onAddToShelf: (anime: AnimeItem, status: ShelfStatus) => void;
  isSavedInShelf: boolean;
  onSelectGenre?: (genre: string) => void;
  onNextSpotlight?: () => void;
  onPrevSpotlight?: () => void;
  onSelectIndex?: (index: number) => void;
  spotlightIndex?: number;
  totalSpotlights?: number;
}

export function HeroBanner({
  anime,
  onSelect,
  onAddToShelf,
  isSavedInShelf,
  onSelectGenre,
  onNextSpotlight,
  onPrevSpotlight: _onPrevSpotlight,
  onSelectIndex: _onSelectIndex,
  spotlightIndex: _spotlightIndex = 0,
  totalSpotlights = 1,
}: HeroBannerProps) {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotation timer that pauses when user hovers cursor over cover
  useEffect(() => {
    if (isHovered || totalSpotlights <= 1 || !onNextSpotlight) return;

    const interval = setInterval(() => {
      onNextSpotlight();
    }, 6500);

    return () => clearInterval(interval);
  }, [isHovered, totalSpotlights, onNextSpotlight]);

  useEffect(() => {
    if (!anime?.broadcast?.string) {
      setCountdown(null);
      return;
    }

    if (anime.airing && anime.broadcast?.day) {
      setCountdown(`Broadcasts ${anime.broadcast.string}`);
    } else if (anime.aired?.string) {
      setCountdown(anime.aired.string);
    } else {
      setCountdown(null);
    }
  }, [anime]);

  if (!anime) {
    return (
      <div className="w-full h-80 sm:h-96 rounded-3xl bg-[#0e121b] animate-pulse flex items-center justify-center text-slate-500 border border-slate-800">
        Loading spotlight anime...
      </div>
    );
  }

  const posterImage =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.webp?.image_url ||
    anime.images?.jpg?.image_url;

  return (
    <section 
      aria-label="Daily Spotlight • Best of Anime"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0e121b] border border-slate-800 shadow-2xl min-h-[290px] sm:min-h-[440px] flex items-center group transition-all"
    >
      {/* Immersive Full-Bleed Backdrop Image with Books-matched Dual Gradients */}
      <div className="absolute inset-0 z-0">
        {posterImage && (
          <img
            src={posterImage}
            alt={anime.title}
            className="w-full h-full object-cover filter blur-xs scale-105 opacity-30 transition-all duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e121b] via-[#0e121b]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e121b] via-transparent to-black/40" />
      </div>

      {/* Hero Content Panel (Identical typography, layout, and colour grading to Library) */}
      <div className="relative z-10 p-3.5 sm:p-10 lg:p-12 max-w-3xl space-y-2.5 sm:space-y-4">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            Daily Spotlight • Best of Anime
          </span>

          {anime.type && (
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700">
              {anime.type}
            </span>
          )}

          {typeof anime.score === 'number' && (
            <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-400 text-amber-400" />
              {anime.score.toFixed(2)}
            </span>
          )}

          {anime.status && (
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700">
              {anime.status}
            </span>
          )}

          {anime.season && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900/80 text-slate-400 border border-slate-800">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="capitalize">{anime.season}</span> {anime.year}
            </span>
          )}

          {anime.genres?.slice(0, 3).map((g) => (
            <button
              key={g.name}
              type="button"
              onClick={() => onSelectGenre?.(g.name)}
              className="px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors cursor-pointer"
              title={`Explore ${g.name} anime`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <h1 
            onClick={() => onSelect(anime)}
            className="text-xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-tight cursor-pointer hover:text-red-400 transition-colors"
          >
            {anime.title}
          </h1>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-[11px] sm:text-sm text-slate-400 font-medium mt-0.5 sm:mt-1">
              {anime.title_english}
            </p>
          )}
        </div>

        {/* Synopsis Paragraph */}
        {anime.synopsis && (
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl">
            {cleanSynopsis(anime.synopsis)}
          </p>
        )}

        {/* Broadcast Countdown notice if available */}
        {countdown && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-red-300">
            <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{countdown}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
          {/* Read Overview Button - Opens Anime Overview Details Modal */}
          <button
            id="hero-read-overview-btn"
            type="button"
            onClick={() => onSelect(anime)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-red-950/40 cursor-pointer flex items-center gap-2"
            title="Read Overview & Details"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Read Overview</span>
          </button>

          {/* Add to Shelf Button */}
          <button
            id="hero-shelf-toggle-btn"
            type="button"
            onClick={() => onAddToShelf(anime, isSavedInShelf ? 'plan_to_watch' : 'watching')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer flex items-center gap-2 ${
              isSavedInShelf
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            {isSavedInShelf ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>On Shelf</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-red-400" />
                <span>Add to Shelf</span>
              </>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
