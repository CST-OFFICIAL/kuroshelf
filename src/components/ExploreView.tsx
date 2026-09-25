import { useState, useEffect, useCallback } from 'react';
import { AnimeItem } from '../types';
import { AnimeCard } from './AnimeCard';
import { Filter, Sparkles, X, ChevronRight } from 'lucide-react';
import { searchAnimePaginated, getTopAnime } from '../services/jikan';

interface ExploreViewProps {
  onSelectAnime: (anime: AnimeItem) => void;
  getShelfStatus: (id: number) => any;
  onUpdateStatus: (anime: AnimeItem, status: any) => void;
  onToggleLike: (anime: AnimeItem) => void;
  getIsLiked: (id: number) => boolean;
  initialGenre?: number | string | null;
}

export interface GenreOption {
  mal_id: number;
  name: string;
  category: 'genre' | 'theme' | 'demographic';
}

export const ALL_EXPLORE_GENRES: GenreOption[] = [
  // Popular Main Genres
  { mal_id: 1, name: 'Action', category: 'genre' },
  { mal_id: 2, name: 'Adventure', category: 'genre' },
  { mal_id: 4, name: 'Comedy', category: 'genre' },
  { mal_id: 8, name: 'Drama', category: 'genre' },
  { mal_id: 10, name: 'Fantasy', category: 'genre' },
  { mal_id: 14, name: 'Horror', category: 'genre' },
  { mal_id: 7, name: 'Mystery', category: 'genre' },
  { mal_id: 22, name: 'Romance', category: 'genre' },
  { mal_id: 24, name: 'Sci-Fi', category: 'genre' },
  { mal_id: 36, name: 'Slice of Life', category: 'genre' },
  { mal_id: 30, name: 'Sports', category: 'genre' },
  { mal_id: 37, name: 'Supernatural', category: 'genre' },
  { mal_id: 41, name: 'Suspense', category: 'genre' },
  { mal_id: 18, name: 'Mecha', category: 'genre' },
  { mal_id: 19, name: 'Music', category: 'genre' },
  { mal_id: 40, name: 'Psychological', category: 'genre' },

  // Themes & Demographics
  { mal_id: 27, name: 'Shounen', category: 'demographic' },
  { mal_id: 42, name: 'Seinen', category: 'demographic' },
  { mal_id: 25, name: 'Shoujo', category: 'demographic' },
  { mal_id: 62, name: 'Isekai', category: 'theme' },
  { mal_id: 17, name: 'Martial Arts', category: 'theme' },
  { mal_id: 38, name: 'Military', category: 'theme' },
  { mal_id: 23, name: 'School', category: 'theme' },
  { mal_id: 31, name: 'Super Power', category: 'theme' },
  { mal_id: 46, name: 'Award Winning', category: 'theme' },
  { mal_id: 47, name: 'Gourmet', category: 'theme' },
  { mal_id: 78, name: 'Time Travel', category: 'theme' },
];

export function ExploreView({
  onSelectAnime,
  getShelfStatus,
  onUpdateStatus,
  onToggleLike,
  getIsLiked,
  initialGenre = null,
}: ExploreViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<number | string | null>(initialGenre);
  const [activeCategory, setActiveCategory] = useState<'all' | 'genre' | 'theme' | 'demographic'>('all');
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sync if initialGenre changes from parent
  useEffect(() => {
    if (initialGenre !== undefined) {
      setSelectedGenre(initialGenre);
    }
  }, [initialGenre]);

  const fetchAnime = useCallback(async (genreVal: number | string | null, pageNum: number) => {
    setLoading(true);
    try {
      const result = await searchAnimePaginated({
        genres: genreVal !== null && genreVal !== undefined ? String(genreVal) : undefined,
        orderBy: genreVal !== null && genreVal !== undefined ? undefined : 'popularity',
        sort: genreVal !== null && genreVal !== undefined ? undefined : 'asc',
        limit: 24,
        page: pageNum,
      });

      let data = result.data || [];
      // Safety guarantee: If search returned empty on All / Popular tab, immediately fallback to top popular anime
      if (data.length === 0 && (genreVal === null || genreVal === undefined || genreVal === 'all')) {
        try {
          const topList = await getTopAnime('bypopularity', 24, pageNum);
          if (topList && topList.length > 0) {
            data = topList;
          }
        } catch (topErr) {
          console.warn('[ExploreView] All/Popular fallback notice:', topErr);
        }
      }

      if (data.length < 24 && !result.pagination?.has_next_page) setHasMore(false);
      else setHasMore(true);
      
      if (pageNum === 1) setResults(data);
      else setResults(prev => [...prev, ...data]);
    } catch (err) {
      console.error('Explore fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchAnime(selectedGenre, 1);
  }, [selectedGenre, fetchAnime]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnime(selectedGenre, nextPage);
  };

  const [showAllPills, setShowAllPills] = useState(false);

  const currentGenreObj = ALL_EXPLORE_GENRES.find(
    g => g.mal_id === Number(selectedGenre) || g.name.toLowerCase() === String(selectedGenre).toLowerCase()
  );

  const filteredGenres = ALL_EXPLORE_GENRES.filter(g => {
    if (activeCategory === 'all') return true;
    return g.category === activeCategory;
  });

  const displayedGenres = activeCategory === 'all' && !showAllPills
    ? filteredGenres.slice(0, 15)
    : filteredGenres;

  const cardGridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6';

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Catalog Discovery</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              {currentGenreObj ? `${currentGenreObj.name} Anime` : 'Explore the Catalog'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {currentGenreObj 
                ? `Showing high-rated and trending ${currentGenreObj.name} titles from local catalog & live index`
                : 'Browse by popular genres, themes, and demographics'}
            </p>
          </div>

          {/* Sub-category tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl self-start sm:self-auto">
            {(['all', 'genre', 'theme', 'demographic'] as const).map(cat => (
              <button
                key={cat}
                id={`filter-category-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat + 's'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Genre Pill Selection Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            id="genre-pill-all"
            onClick={() => setSelectedGenre(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selectedGenre === null
                ? 'bg-rose-600 text-white font-semibold shadow-sm shadow-rose-950/40 border border-rose-500'
                : 'bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-neutral-700'
            }`}
          >
            All / Popular
          </button>

          {displayedGenres.map(g => {
            const isSelected = selectedGenre === g.mal_id || String(selectedGenre).toLowerCase() === g.name.toLowerCase();
            return (
              <button
                key={g.mal_id}
                id={`genre-pill-${g.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedGenre(isSelected ? null : g.mal_id)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white font-semibold shadow-sm shadow-rose-950/40 border border-rose-500'
                    : 'bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-neutral-700 font-medium'
                }`}
              >
                <span>{g.name}</span>
                {isSelected && <X className="w-3 h-3 text-rose-200 ml-0.5" />}
              </button>
            );
          })}

          {activeCategory === 'all' && filteredGenres.length > 15 && (
            <button
              onClick={() => setShowAllPills(prev => !prev)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-neutral-900/60 border border-dashed border-slate-300 dark:border-neutral-700 text-rose-600 dark:text-rose-400 hover:border-rose-500/50 transition-all cursor-pointer"
            >
              {showAllPills ? 'Show fewer tags' : `+${filteredGenres.length - 15} more`}
            </button>
          )}
        </div>

        {/* Active Filter Indicator */}
        {selectedGenre !== null && (
          <div className="flex items-center justify-between text-xs py-2 px-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <Sparkles className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              <span>
                Filtering by <strong>{currentGenreObj ? currentGenreObj.name : selectedGenre}</strong> ({results.length} titles loaded)
              </span>
            </div>
            <button
              onClick={() => setSelectedGenre(null)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium transition-colors cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Grid Results */}
      {loading && results.length === 0 ? (
        <div className={`${cardGridClass} animate-pulse`}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-slate-200/70 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/30">
          <Filter className="w-8 h-8 mx-auto text-slate-400 dark:text-neutral-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No titles found for this genre</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Try selecting a different genre or clearing the current filter to view popular anime.
          </p>
          <button
            onClick={() => setSelectedGenre(null)}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={cardGridClass}>
          {results.map((anime, idx) => (
            <AnimeCard
              key={`explore-${anime.mal_id}-${idx}`}
              anime={anime}
              onSelect={onSelectAnime}
              isLiked={getIsLiked(anime.mal_id)}
              onToggleLike={onToggleLike}
              shelfStatus={getShelfStatus(anime.mal_id)}
              onUpdateShelfStatus={onUpdateStatus}
              onSelectGenre={(genreName) => setSelectedGenre(genreName)}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && results.length > 0 && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            id="explore-load-more-btn"
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading more...</span>
              </>
            ) : (
              <>
                <span>Load More {currentGenreObj ? currentGenreObj.name : ''} Anime</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
