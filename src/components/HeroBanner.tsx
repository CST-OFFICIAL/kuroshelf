import { AnimeItem, ShelfStatus } from '../types';
import { Play, Plus, Check, Star, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeroBannerProps {
  anime: AnimeItem | null;
  onSelect: (anime: AnimeItem) => void;
  onAddToShelf: (anime: AnimeItem, status: ShelfStatus) => void;
  isSavedInShelf: boolean;
}

export function HeroBanner({ anime, onSelect, onAddToShelf, isSavedInShelf }: HeroBannerProps) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!anime?.broadcast?.string) {
      setCountdown(null);
      return;
    }

    // Estimate next broadcast interval or show broadcast string
    const updateTicker = () => {
      if (anime.airing && anime.broadcast?.day) {
        setCountdown(`Broadcasts ${anime.broadcast.string}`);
      } else if (anime.aired?.string) {
        setCountdown(anime.aired.string);
      } else {
        setCountdown(null);
      }
    };

    updateTicker();
  }, [anime]);

  if (!anime) {
    return (
      <div className="w-full h-80 sm:h-96 rounded-2xl bg-neutral-900 animate-pulse flex items-center justify-center text-neutral-600 border border-neutral-800">
        Loading spotlight anime...
      </div>
    );
  }

  const imageUrl =
    anime.images.webp?.large_image_url ||
    anime.images.jpg.large_image_url ||
    anime.images.jpg.image_url;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl">
      {/* Background Image with layered gradient overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageUrl}
          alt={anime.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-25 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
        {/* Poster thumbnail */}
        <div 
          onClick={() => onSelect(anime)}
          className="shrink-0 w-36 sm:w-44 md:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700/60 cursor-pointer group relative"
        >
          <img
            src={imageUrl}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-rose-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
              Quick View
            </span>
          </div>
        </div>

        {/* Text & Meta Details */}
        <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider text-[11px]">
              Featured Selection
            </span>
            {anime.score && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {anime.score.toFixed(2)}
              </span>
            )}
            {anime.status && (
              <span className="px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium">
                {anime.status}
              </span>
            )}
            {anime.season && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-400 border border-neutral-800">
                <Calendar className="w-3 h-3 text-neutral-400" />
                <span className="capitalize">{anime.season}</span> {anime.year}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 
              onClick={() => onSelect(anime)}
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white cursor-pointer hover:text-rose-400 transition-colors font-display line-clamp-2"
            >
              {anime.title}
            </h1>
            {anime.title_japanese && (
              <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                {anime.title_japanese}
              </p>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-3xl">
            {anime.synopsis || 'No synopsis available.'}
          </p>

          {/* Broadcast Countdown notice if available */}
          {countdown && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs text-rose-300">
              <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{countdown}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
            <button
              id="hero-view-details"
              onClick={() => onSelect(anime)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-rose-900/30"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Explore Title</span>
            </button>

            <button
              id="hero-shelf-toggle"
              onClick={() => onAddToShelf(anime, isSavedInShelf ? 'plan_to_watch' : 'watching')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                isSavedInShelf
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
              }`}
            >
              {isSavedInShelf ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>On Shelf</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Add to Shelf</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
