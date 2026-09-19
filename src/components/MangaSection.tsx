import { useState, useEffect } from 'react';
import { MangaItem, ShelfEntry, ShelfStatus } from '../types';
import { getTopManga, searchManga } from '../services/jikan';
import {
  BookOpen,
  Star,
  ExternalLink,
  Search,
  ShoppingBag,
  Heart,
  Bookmark,
  Check,
  X,
  Layers,
  User,
} from 'lucide-react';
import { siteConfig } from '../config/site';
import { MediaImage } from './MediaImage';
import { cleanSynopsis } from '../utils/textUtils';

interface MangaSectionProps {
  shelf?: ShelfEntry[];
  onAddToShelf?: (manga: MangaItem, status: ShelfStatus) => void;
  onToggleLike?: (id: number, mediaType: 'anime' | 'manga', title: string, image: string) => void;
  onSelectManga?: (manga: MangaItem) => void;
  initialSearchQuery?: string;
}

export function MangaSection({
  shelf = [],
  onAddToShelf,
  onToggleLike,
  onSelectManga,
  initialSearchQuery = '',
}: MangaSectionProps) {
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedMangaDetail, setSelectedMangaDetail] = useState<MangaItem | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<number | null>(null);

  // Sync if initialSearchQuery updates from another tab/modal
  useEffect(() => {
    if (initialSearchQuery) {
      setSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      const fetcher = search.trim() ? searchManga(search.trim(), 24) : getTopManga(24);
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
    }, search ? 350 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  const getShelfItem = (id: number) => {
    return shelf.find((s) => s.id === id && s.mediaType === 'manga');
  };

  const getStatusLabel = (status: ShelfStatus) => {
    switch (status) {
      case 'watching':
        return 'Reading';
      case 'plan_to_watch':
        return 'Plan to Read';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      case 'dropped':
        return 'Dropped';
      default:
        return 'Save';
    }
  };

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
            Manga Discovery & Shelf Tracker
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Explore manga masterpieces, track chapters on your Kuro Shelf, and find official Amazon volume releases.
          </p>
        </div>

        {/* Search inside Manga */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search titles, authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Affiliate & Support Notice */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-neutral-300">
            Official localized volumes and tankobon editions can be explored directly on Amazon to support the mangaka and publishers.
          </p>
        </div>
        {siteConfig.affiliate.amazonAssociatesActive && (
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold shrink-0">
            Amazon Affiliate System
          </span>
        )}
      </div>

      {/* Manga Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-xl bg-neutral-900 animate-pulse border border-neutral-800"
            />
          ))}
        </div>
      ) : mangaList.length === 0 ? (
        <div className="p-12 text-center text-neutral-400 text-xs bg-neutral-900/50 rounded-2xl border border-neutral-800">
          No manga titles found matching &quot;{search}&quot;. Try a different title or author name.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mangaList.map((manga, idx) => {
            const shelfItem = getShelfItem(manga.mal_id);
            const isLiked = shelfItem?.isLiked || false;
            const currentStatus = shelfItem?.status;
            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(`${manga.title} manga volume 1`)}&tag=kuroshelf-20`;

            return (
              <div
                key={`manga-${manga.mal_id}-${idx}`}
                className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-150 shadow-sm"
              >
                {/* Poster */}
                <div
                  className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950 cursor-pointer"
                  onClick={() => {
                    setSelectedMangaDetail(manga);
                    onSelectManga?.(manga);
                  }}
                >
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

                  {/* Score badge */}
                  {manga.score && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/90 border border-amber-500/30 text-amber-300 font-bold text-[11px] shadow">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{manga.score.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Like button overlay */}
                  {onToggleLike && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(
                          manga.mal_id,
                          'manga',
                          manga.title,
                          manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url
                        );
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                        isLiked
                          ? 'bg-rose-600 text-white'
                          : 'bg-neutral-950/70 text-neutral-300 hover:text-rose-400 hover:bg-neutral-900'
                      }`}
                      title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  {/* Chapters or volumes badge */}
                  {manga.chapters ? (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-neutral-950/85 backdrop-blur-xs text-neutral-300 font-medium">
                      {manga.chapters} chs
                    </span>
                  ) : manga.status ? (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-neutral-950/85 backdrop-blur-xs text-neutral-300 font-medium">
                      {manga.status}
                    </span>
                  ) : null}
                </div>

                {/* Info & Shelf controls */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    <h3
                      onClick={() => {
                        setSelectedMangaDetail(manga);
                        onSelectManga?.(manga);
                      }}
                      className="text-xs font-bold text-white line-clamp-1 hover:text-rose-400 cursor-pointer transition-colors"
                      title={manga.title}
                    >
                      {manga.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                      {manga.authors?.map((a) => a.name).join(', ') || manga.type || 'Manga'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-neutral-800/80">
                    {/* Shelf Status Trigger */}
                    {onAddToShelf && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStatusMenuId(
                              activeStatusMenuId === manga.mal_id ? null : manga.mal_id
                            )
                          }
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            currentStatus
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                              : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Bookmark className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">
                              {currentStatus ? getStatusLabel(currentStatus) : 'Add to Shelf'}
                            </span>
                          </span>
                          <span className="text-[9px] text-neutral-400 font-bold">▾</span>
                        </button>

                        {/* Status dropdown */}
                        {activeStatusMenuId === manga.mal_id && (
                          <div className="absolute left-0 bottom-full mb-1 w-full z-30 bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl overflow-hidden py-1 text-xs">
                            {(
                              [
                                { id: 'watching', label: 'Reading' },
                                { id: 'plan_to_watch', label: 'Plan to Read' },
                                { id: 'completed', label: 'Completed' },
                                { id: 'on_hold', label: 'On Hold' },
                                { id: 'dropped', label: 'Dropped' },
                              ] as { id: ShelfStatus; label: string }[]
                            ).map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  onAddToShelf(manga, st.id);
                                  setActiveStatusMenuId(null);
                                }}
                                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                                  currentStatus === st.id
                                    ? 'text-rose-400 font-bold bg-rose-500/10'
                                    : 'text-neutral-300'
                                }`}
                              >
                                <span>{st.label}</span>
                                {currentStatus === st.id && <Check className="w-3 h-3 text-rose-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amazon link button */}
                    <a
                      href={amazonUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 font-semibold text-[11px] transition-colors border border-neutral-800"
                    >
                      <span>Amazon Volume</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manga Detail Quick View Modal */}
      {selectedMangaDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedMangaDetail(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedMangaDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5">
              {/* Poster */}
              <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0 aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                <MediaImage
                  malId={selectedMangaDetail.mal_id}
                  images={selectedMangaDetail.images}
                  alt={selectedMangaDetail.title}
                  title={selectedMangaDetail.title}
                  mediaType="manga"
                  aspectRatio="aspect-[3/4]"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {selectedMangaDetail.type || 'Manga'}
                    </span>
                    {selectedMangaDetail.score && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {selectedMangaDetail.score}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {selectedMangaDetail.title}
                  </h3>
                  {selectedMangaDetail.title_english && (
                    <p className="text-xs text-neutral-400">
                      {selectedMangaDetail.title_english}
                    </p>
                  )}
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">
                      {selectedMangaDetail.authors?.map((a) => a.name).join(', ') || 'Unknown Author'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Layers className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>
                      {selectedMangaDetail.chapters ? `${selectedMangaDetail.chapters} Chapters` : 'Ongoing'}
                      {selectedMangaDetail.volumes ? ` • ${selectedMangaDetail.volumes} Vols` : ''}
                    </span>
                  </div>
                </div>

                {/* Synopsis */}
                <div className="max-h-40 overflow-y-auto text-xs text-neutral-300 leading-relaxed pr-2">
                  <p>{cleanSynopsis(selectedMangaDetail.synopsis) || 'No synopsis provided for this title.'}</p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  {onAddToShelf && (
                    <button
                      type="button"
                      onClick={() => {
                        const current = getShelfItem(selectedMangaDetail.mal_id)?.status;
                        const next = current === 'watching' ? 'completed' : 'watching';
                        onAddToShelf(selectedMangaDetail, next);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>
                        {getShelfItem(selectedMangaDetail.mal_id)
                          ? `Shelf: ${getStatusLabel(getShelfItem(selectedMangaDetail.mal_id)!.status)}`
                          : 'Track on Kuro Shelf'}
                      </span>
                    </button>
                  )}

                  <a
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(`${selectedMangaDetail.title} manga volume 1`)}&tag=kuroshelf-20`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                  >
                    <span>Check on Amazon</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
