import { useState, useEffect } from 'react';
import { MangaItem } from '../types';
import { getTopManga, searchManga } from '../services/jikan';
import { BookOpen, Star, ExternalLink, Search, ShoppingBag } from 'lucide-react';
import { siteConfig } from '../config/site';
import { MediaImage } from './MediaImage';

interface MangaSectionProps {
  onSelectManga?: (manga: MangaItem) => void;
}

export function MangaSection({ onSelectManga }: MangaSectionProps) {
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      const fetcher = search.trim() ? searchManga(search, 20) : getTopManga(20);
      fetcher
        .then((data) => {
          if (isMounted) setMangaList(data);
        })
        .catch(() => {
          if (isMounted) setMangaList([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, search ? 400 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Manga & Light Novels</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Manga Discovery & Physical Shelf
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Explore highest-rated manga series, source materials, and official Amazon physical volume editions.
          </p>
        </div>

        {/* Search inside Manga */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search manga series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Affiliate Banner Notification */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-neutral-300">
            Official localized English & Japanese volumes can be purchased directly through verified retail links to support the mangaka.
          </p>
        </div>
        {siteConfig.affiliate.amazonAssociatesActive && (
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            Amazon Associate Affiliate System
          </span>
        )}
      </div>

      {/* Manga Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-neutral-900 animate-pulse border border-neutral-800"
            />
          ))}
        </div>
      ) : mangaList.length === 0 ? (
        <div className="p-12 text-center text-neutral-400 text-xs">
          No manga titles found. Try a different search query.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mangaList.map((manga, idx) => {
            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(`${manga.title} manga volume 1`)}&tag=kuroshelf-20`;

            return (
              <div
                key={`manga-${manga.mal_id}-${idx}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all hover:-translate-y-1 shadow-md"
              >
                {/* Poster */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
                  <MediaImage
                    malId={manga.mal_id}
                    images={manga.images}
                    alt={manga.title}
                    title={manga.title}
                    mediaType="manga"
                    aspectRatio="aspect-[3/4]"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {manga.score && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 font-bold text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{manga.score.toFixed(1)}</span>
                    </div>
                  )}
                  {manga.chapters ? (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-neutral-950/80 text-neutral-300 font-medium">
                      {manga.chapters} chapters
                    </span>
                  ) : null}
                </div>

                {/* Info & Amazon Link */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <h3
                      onClick={() => onSelectManga?.(manga)}
                      className="text-xs sm:text-sm font-bold text-white line-clamp-1 hover:text-rose-400 cursor-pointer"
                      title={manga.title}
                    >
                      {manga.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {manga.authors?.map((a) => a.name).join(', ') || manga.type || 'Manga'}
                    </p>
                  </div>

                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs transition-colors border border-neutral-700"
                  >
                    <span>Amazon Edition</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
