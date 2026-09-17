import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { AnimeItem, ShelfStatus } from '../types';
import { AnimeCard } from './AnimeCard';


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
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [orderBy, setOrderBy] = useState('popularity');
  const [sort, setSort] = useState('asc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = useCallback(async (isLoadMore = false) => {
    setLoading(true);
    try {
      // We will need to construct a robust URL for jikan api
      const queryParams = new URLSearchParams();
      if (debouncedQuery) queryParams.set('q', debouncedQuery);
      if (status) queryParams.set('status', status);
      if (type) queryParams.set('type', type);
      if (orderBy) queryParams.set('order_by', orderBy);
      if (sort) queryParams.set('sort', sort);
      queryParams.set('page', isLoadMore ? String(page + 1) : '1');
      queryParams.set('limit', '24');
      
      const res = await fetch(`/api/anime/search?${queryParams.toString()}`);
      const data = await res.json();
      
      if (data && data.success && data.data) {
        if (isLoadMore) {
          setResults(prev => {
            const newItems = data.data.filter((d: any) => !prev.some(p => p.mal_id === d.mal_id));
            return [...prev, ...newItems];
          });
          setPage(p => p + 1);
        } else {
          setResults(data.data);
          setPage(1);
        }
        setHasMore(data.pagination?.has_next_page || data.data.length === 24);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, status, type, orderBy, sort, page]);

  useEffect(() => {
    setResults([]);
    fetchResults(false);
  }, [debouncedQuery, status, type, orderBy, sort]); // initial fetch

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Advanced Search
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Search the entire global anime database. Find underrated gems or specific titles.
        </p>
      </div>

      <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ANY anime, character, or keyword... (e.g. Denji, Chainsaw Man)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500"
          >
            <option value="">Any Status</option>
            <option value="airing">Airing</option>
            <option value="complete">Complete</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500"
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
            className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500"
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
            className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
