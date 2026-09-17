import { useState, useEffect, useCallback } from 'react';
import { AnimeItem, JikanGenre } from '../types';
import { AnimeCard } from './AnimeCard';
import { Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface ExploreViewProps {
  onSelectAnime: (anime: AnimeItem) => void;
  getShelfStatus: (id: number) => any;
  onUpdateStatus: (anime: AnimeItem, status: any) => void;
  onToggleLike: (anime: AnimeItem) => void;
  getIsLiked: (id: number) => boolean;
}

const COMMON_GENRES: JikanGenre[] = [
  { mal_id: 1, name: 'Action', type: 'anime', url: '' },
  { mal_id: 2, name: 'Adventure', type: 'anime', url: '' },
  { mal_id: 4, name: 'Comedy', type: 'anime', url: '' },
  { mal_id: 8, name: 'Drama', type: 'anime', url: '' },
  { mal_id: 10, name: 'Fantasy', type: 'anime', url: '' },
  { mal_id: 14, name: 'Horror', type: 'anime', url: '' },
  { mal_id: 7, name: 'Mystery', type: 'anime', url: '' },
  { mal_id: 22, name: 'Romance', type: 'anime', url: '' },
  { mal_id: 24, name: 'Sci-Fi', type: 'anime', url: '' },
  { mal_id: 36, name: 'Slice of Life', type: 'anime', url: '' },
  { mal_id: 30, name: 'Sports', type: 'anime', url: '' },
  { mal_id: 37, name: 'Supernatural', type: 'anime', url: '' },
  { mal_id: 41, name: 'Suspense', type: 'anime', url: '' },
];

export function ExploreView({
  onSelectAnime,
  getShelfStatus,
  onUpdateStatus,
  onToggleLike,
  getIsLiked,
}: ExploreViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchAnime = useCallback(async (genreId: number | null, pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '24', page: String(pageNum) });
      if (genreId) {
        params.set('genres', String(genreId));
      } else {
        params.set('order_by', 'popularity');
        params.set('sort', 'asc');
      }
      
      const res = await fetch(`/api/anime/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        if (data.length < 24) setHasMore(false);
        else setHasMore(true);
        
        if (pageNum === 1) setResults(data);
        else setResults(prev => [...prev, ...data]);
      }
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
            <Filter className="w-4 h-4" />
            <span>Discover</span>
          </div>
          <h2 className="text-2xl font-bold font-display">Explore the Catalog</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGenre === null
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            All / Popular
          </button>
          {COMMON_GENRES.map(g => (
            <button
              key={g.mal_id}
              onClick={() => setSelectedGenre(g.mal_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedGenre === g.mal_id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:gap-6">
        {results.map((anime, idx) => (
          <motion.div
            key={`explore-${anime.mal_id}-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (idx % 24) * 0.03 }}
          >
            <AnimeCard
              anime={anime}
              onSelect={onSelectAnime}
              isLiked={getIsLiked(anime.mal_id)}
              onToggleLike={onToggleLike}
              shelfStatus={getShelfStatus(anime.mal_id)}
              onUpdateShelfStatus={onUpdateStatus}
            />
          </motion.div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-rose-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && hasMore && results.length > 0 && (
        <div className="flex justify-center pt-8 pb-12">
          <button
            onClick={loadMore}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-sm font-semibold rounded-xl transition-all"
          >
            Load More Titles
          </button>
        </div>
      )}
    </motion.div>
  );
}
