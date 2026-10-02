import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Filter, ChevronDown, Sparkles, Check } from 'lucide-react';
import { AnimeItem, ShelfStatus } from '../types';
import { AnimeCard } from './AnimeCard';
import { searchAnimePaginated, getTopAnimePaginated } from '../services/jikan';
import { ALL_EXPLORE_GENRES } from './ExploreView';

interface AdvancedSearchViewProps {
  onSelectAnime: (anime: AnimeItem) => void;
  getShelfStatus: (id: number) => ShelfStatus | null;
  onUpdateStatus: (anime: AnimeItem, status: ShelfStatus) => void;
  onToggleLike: (anime: AnimeItem) => void;
  getIsLiked: (id: number) => boolean;
}

export function AdvancedSearchView({
  onSelectAnime,
  getShelfStatus,
  onUpdateStatus,
  onToggleLike,
  getIsLiked
}: AdvancedSearchViewProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Advanced filters
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [orderBy, setOrderBy] = useState('popularity');
  const [sort, setSort] = useState('asc');

  // Interactive Genre Dropdown State
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState('');
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  // Close genre dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query.trim());
  };

  const currentGenreName = genre
    ? ALL_EXPLORE_GENRES.find((g) => String(g.mal_id) === genre)?.name || genre
    : null;

  const filteredGenres = ALL_EXPLORE_GENRES.filter((g) =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase().trim())
  );

  const fetchResults = useCallback(async (isLoadMore = false) => {
    setLoading(true);

    try {
      const nextPage = isLoadMore ? page + 1 : 1;

      const hasFilters =
        Boolean(debouncedQuery.trim()) ||
        Boolean(genre) ||
        Boolean(status) ||
        Boolean(type);

      let result;

      if (!hasFilters) {
        result = await getTopAnimePaginated('bypopularity', nextPage, 24);
      } else {
        result = await searchAnimePaginated({
          query: debouncedQuery.trim(),
          page: nextPage,
          limit: 24,
          genres: genre || undefined,
          status: status || undefined,
          type: type || undefined,
          orderBy: orderBy || undefined,
          sort: sort || undefined,
        });
      }

      const data = result.data || [];

      if (isLoadMore) {
        setResults(prev => {
          const existingIds = new Set(prev.map(item => item.mal_id));
          const uniqueNewItems = data.filter(
            (item: AnimeItem) => !existingIds.has(item.mal_id)
          );
          return [...prev, ...uniqueNewItems];
        });
        setPage(nextPage);
      } else {
        setResults(data);
        setPage(1);
      }

      setHasMore(
        Boolean(
          result.pagination?.has_next_page ||
          data.length === 24
        )
      );
    } catch (err) {
      console.error('Catalog fetch failed:', err);

      if (!isLoadMore) {
        setResults([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    genre,
    status,
    type,
    orderBy,
    sort,
    page,
  ]);

  useEffect(() => {
    setResults([]);
    fetchResults(false);
  }, [debouncedQuery, genre, status, type, orderBy, sort]); // initial fetch

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display hover:text-rose-500 transition-colors cursor-default">
          Anime Catalog
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Explore and filter the entire anime catalog. Find underrated gems, classic titles, or upcoming releases.
        </p>
      </div>

      <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
              aria-label="Submit search"
            >
              <Search className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime, character, or keyword..."
              className="w-full min-w-0 bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors truncate text-ellipsis overflow-hidden placeholder:truncate placeholder:text-ellipsis"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-sm p-1 cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold text-sm rounded-lg transition-all shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search Catalog</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Interactive Custom Genre Dropdown Menu */}
          <div ref={genreDropdownRef} className="relative">
            <button
              type="button"
              id="catalog-genre-dropdown-trigger"
              onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
              className={`h-9 px-3.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                genre
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
              }`}
              aria-expanded={genreDropdownOpen}
              title="Filter catalog by genre"
            >
              <Filter className={`w-3.5 h-3.5 ${genre ? 'text-rose-500' : 'text-neutral-400'}`} />
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {currentGenreName ? `Genre: ${currentGenreName}` : 'All Genres'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${genreDropdownOpen ? 'rotate-180 text-rose-500' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {genreDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Select Anime Genre
                    </span>
                  </div>
                  {genre && (
                    <button
                      type="button"
                      onClick={() => {
                        setGenre('');
                        setGenreDropdownOpen(false);
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Genre Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    placeholder="Search genres (Action, Romance, Isekai...)"
                    className="w-full h-8 pl-8 pr-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Genre List Grid */}
                <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setGenre('');
                      setGenreDropdownOpen(false);
                    }}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                      !genre
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>All Genres</span>
                    {!genre && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {filteredGenres.map((g) => {
                    const isSelected = genre === String(g.mal_id);
                    return (
                      <button
                        key={g.mal_id}
                        type="button"
                        onClick={() => {
                          setGenre(isSelected ? '' : String(g.mal_id));
                          setGenreDropdownOpen(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span className="truncate">{g.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-medium rounded-lg px-3 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
          >
            <option value="">Any Status</option>
            <option value="airing">Airing</option>
            <option value="complete">Complete</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="h-9 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-medium rounded-lg px-3 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
          >
            <option value="">Any Type</option>
            <option value="tv">TV</option>
            <option value="movie">Movie</option>
            <option value="ova">OVA</option>
            <option value="ona">ONA</option>
          </select>
          <select 
            value={orderBy} 
            onChange={(e) => setOrderBy(e.target.value)}
            className="h-9 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-medium rounded-lg px-3 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
          >
            <option value="popularity">Popularity</option>
            <option value="score">Score</option>
            <option value="rank">Rank</option>
            <option value="title">Title</option>
            <option value="start_date">Start Date</option>
          </select>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="h-9 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-medium rounded-lg px-3 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Quick Genre Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-neutral-800/80 pt-3">
          <button
            type="button"
            onClick={() => setGenre('')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              !genre
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            All Genres
          </button>
          {ALL_EXPLORE_GENRES.slice(0, 14).map((g) => {
            const isSelected = genre === String(g.mal_id);
            return (
              <button
                key={`catalog-chip-${g.mal_id}`}
                type="button"
                onClick={() => setGenre(isSelected ? '' : String(g.mal_id))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {results.map((anime, idx) => (
          <AnimeCard
            key={`adv-search-${anime.mal_id}-${idx}`}
            anime={anime}
            onSelect={onSelectAnime}
            isLiked={getIsLiked(anime.mal_id)}
            onToggleLike={onToggleLike}
            shelfStatus={getShelfStatus(anime.mal_id)}
            onUpdateShelfStatus={onUpdateStatus}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          No anime found matching your criteria.
        </div>
      )}

      {hasMore && !loading && results.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchResults(true)}
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg border border-neutral-800 transition-colors"
          >
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
}
