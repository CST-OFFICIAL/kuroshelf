import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';

interface SearchAndGenreBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onClearSearch: () => void;
  selectedGenre?: string | null;
  onSelectGenre: (genre: string | null) => void;
  onOpenExploreGenre?: (genre: string | number) => void;
  onOpenAllGenres?: () => void;
}

export const QUICK_GENRES = [
  { value: '1', name: 'Action' },
  { value: '10', name: 'Fantasy' },
  { value: '22', name: 'Romance' },
  { value: '4', name: 'Comedy' },
  { value: '24', name: 'Sci-Fi' },
  { value: '27', name: 'Shounen' },
  { value: '36', name: 'Slice of Life' },
  { value: '7', name: 'Mystery' },
  { value: '37', name: 'Supernatural' },
  { value: '30', name: 'Sports' },
  { value: '62', name: 'Isekai' },
  { value: '14', name: 'Horror' },
  { value: '8', name: 'Drama' },
  { value: '40', name: 'Psychological' },
];

export function SearchAndGenreBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  selectedGenre,
  onSelectGenre,
  onOpenExploreGenre,
  onOpenAllGenres,
}: SearchAndGenreBarProps) {
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      onSearchSubmit(trimmed);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const currentGenreName = selectedGenre
    ? QUICK_GENRES.find((g) => g.value === selectedGenre || g.name.toLowerCase() === selectedGenre.toLowerCase())?.name || selectedGenre
    : null;

  return (
    <section 
      aria-label="Search and Genre Discovery" 
      className="w-full bg-white dark:bg-[#12151f] rounded-2xl border-2 border-slate-200/90 dark:border-neutral-800 p-3 sm:p-4 shadow-sm transition-all"
    >
      {/* Primary Search & Genre Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input Container */}
        <form 
          onSubmit={handleSubmit} 
          className="relative flex-1 flex items-center min-w-0"
        >
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-rose-500">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anime by title, English/Japanese name, character, or studio..."
            className="main-search-input w-full h-11 sm:h-12 pl-11 pr-24 sm:pr-28 rounded-xl bg-slate-100/90 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700/80 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all shadow-inner"
          />

          {/* Quick Clear Button inside input */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                id="search-clear-button"
                onClick={onClearSearch}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                aria-label="Clear search input"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Prominent Search Action Button */}
            <button
              type="submit"
              id="search-action-button"
              className="h-8 sm:h-9 px-3.5 sm:px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              aria-label="Search anime"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Genre Selector Dropdown Button (Moved from Top Shelf) */}
        <div ref={dropdownRef} className="relative shrink-0 flex items-center gap-2">
          <button
            type="button"
            id="genre-dropdown-trigger"
            onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
            className={`h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              selectedGenre
                ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-300'
                : 'bg-slate-100/90 dark:bg-neutral-900 border-slate-300 dark:border-neutral-700/80 text-slate-800 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-800'
            }`}
            title="Filter anime by genre"
            aria-expanded={genreDropdownOpen}
          >
            <Filter className="w-4 h-4 text-rose-500" />
            <span className="truncate max-w-[130px] sm:max-w-[160px]">
              {currentGenreName ? `Genre: ${currentGenreName}` : 'All Genres'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${genreDropdownOpen ? 'rotate-180 text-rose-500' : 'text-slate-400'}`} />
          </button>

          {/* Quick Explore Link Button */}
          {onOpenAllGenres && (
            <button
              type="button"
              id="explore-all-genres-btn"
              onClick={onOpenAllGenres}
              className="hidden md:flex h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 dark:border-neutral-700/80 bg-slate-100/90 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-rose-500 dark:hover:text-rose-400 text-sm font-semibold items-center gap-1.5 transition-colors cursor-pointer"
              title="Open full genre directory"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore</span>
            </button>
          )}

          {/* Genre Dropdown Menu */}
          {genreDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-2.5 rounded-xl bg-white dark:bg-[#151923] border border-slate-200 dark:border-neutral-700 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-neutral-800 px-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Select Genre
                </span>
                {selectedGenre && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectGenre(null);
                      setGenreDropdownOpen(false);
                    }}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectGenre(null);
                    setGenreDropdownOpen(false);
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !selectedGenre
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  All Genres
                </button>

                {QUICK_GENRES.map((g) => {
                  const isSelected = selectedGenre === g.value || selectedGenre?.toLowerCase() === g.name.toLowerCase();
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        onSelectGenre(isSelected ? null : g.value);
                        setGenreDropdownOpen(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate ${
                        isSelected
                          ? 'bg-rose-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>

              {selectedGenre && onOpenExploreGenre && (
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setGenreDropdownOpen(false);
                      onOpenExploreGenre(selectedGenre);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <span>View &ldquo;{currentGenreName}&rdquo; in Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {onOpenAllGenres && (
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setGenreDropdownOpen(false);
                      onOpenAllGenres();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <span>Browse All 25+ Genres & Themes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
