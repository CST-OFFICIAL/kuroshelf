import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MangaItem, ShelfEntry, ShelfStatus } from '../types';
import {
  X,
  Star,
  BookOpen,
  Bookmark,
  Heart,
  Plus,
  Minus,
  Check,
  ExternalLink,
  Layers,
  ShoppingBag,
  Trash2,
  ListPlus,
} from 'lucide-react';
import { siteConfig } from '../config/site';
import { cleanSynopsis } from '../utils/textUtils';
import { MediaImage } from './MediaImage';
import { AddToPlaylistModal } from './AddToPlaylistModal';

interface BookDetailModalProps {
  book: MangaItem | null;
  shelf?: ShelfEntry[];
  onClose: () => void;
  onUpdateStatus?: (id: number, status: ShelfStatus) => void;
  onUpdateProgress?: (id: number, progress: number) => void;
  onToggleLike?: (id: number, title: string, image: string) => void;
  onRemoveFromShelf?: (id: number) => void;
  isLoggedIn?: boolean;
  onRequireAuth?: () => void;
}

export function BookDetailModal({
  book,
  shelf = [],
  onClose,
  onUpdateStatus,
  onUpdateProgress,
  onToggleLike,
  onRemoveFromShelf,
  isLoggedIn = true,
  onRequireAuth,
}: BookDetailModalProps) {
  const shelfItem = (shelf || []).find((s) => s.id === book?.mal_id && s.mediaType === 'manga');
  const [currentProgress, setCurrentProgress] = useState(shelfItem?.progress || 0);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);

  useEffect(() => {
    setCurrentProgress(shelfItem?.progress || 0);
  }, [shelfItem?.progress]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!book) return null;

  const handleStatusChange = (status: ShelfStatus) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    if (onUpdateStatus) {
      onUpdateStatus(book.mal_id, status);
    }
  };

  const handleProgressChange = (newVal: number) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    const maxVal = book.chapters || 9999;
    const clamped = Math.max(0, Math.min(newVal, maxVal));
    setCurrentProgress(clamped);
    if (onUpdateProgress) {
      onUpdateProgress(book.mal_id, clamped);
    }
  };

  const poster =
    book.images?.webp?.large_image_url ||
    book.images?.jpg?.large_image_url ||
    book.images?.jpg?.image_url ||
    '';

  const formatTag = book.type || 'Manga';
  const isManhwa = formatTag === 'Manhwa' || book.countryOfOrigin === 'KR';
  const isManhua = formatTag === 'Manhua' || book.countryOfOrigin === 'CN';
  const isNovel = formatTag.toLowerCase().includes('novel') || book.format === 'NOVEL';

  const amazonSearchUrl = siteConfig.affiliate?.amazonTag
    ? `https://www.amazon.com/s?k=${encodeURIComponent(book.title)}+${isNovel ? 'light+novel' : isManhwa ? 'manhwa' : 'manga'}&tag=${siteConfig.affiliate.amazonTag}`
    : `https://www.amazon.com/s?k=${encodeURIComponent(book.title)}+${isNovel ? 'light+novel' : 'manga'}`;

  const modalJSX = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-3xl my-auto bg-[#0d1017] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
          {book.bannerImage || poster ? (
            <img
              src={book.bannerImage || poster}
              alt=""
              className="w-full h-full object-cover filter blur-xs scale-105 opacity-40"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/60 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all border border-white/10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-5 sm:px-8 pb-8 -mt-24 sm:-mt-28 relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Poster cover */}
            <div className="relative w-36 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-900 shrink-0 mx-auto sm:mx-0">
              <MediaImage
                images={book.images}
                src={poster}
                alt={book.title}
                title={book.title}
                mediaType="manga"
                aspectRatio="aspect-[3/4]"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm z-10">
                {isNovel ? 'Novel' : isManhwa ? 'Manhwa' : isManhua ? 'Manhua' : 'Manga'}
              </div>
            </div>

            {/* Header info */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {book.status || 'Publishing'}
                  </span>
                  {book.countryOfOrigin && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {book.countryOfOrigin === 'KR' ? '🇰🇷 Korea (Webtoon)' : book.countryOfOrigin === 'CN' ? '🇨🇳 China' : '🇯🇵 Japan'}
                    </span>
                  )}
                  {typeof book.score === 'number' && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {book.score.toFixed(1)}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white font-display leading-tight">
                  {book.title}
                </h2>
                {book.title_english && book.title_english !== book.title && (
                  <p className="text-xs text-slate-400 italic">
                    {book.title_english}
                  </p>
                )}
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-300">
                {typeof book.chapters === 'number' && (
                  <span className="flex items-center gap-1.5 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{book.chapters} Chapters</span>
                  </span>
                )}
                {typeof book.volumes === 'number' && (
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{book.volumes} Volumes</span>
                  </span>
                )}
                {book.authors && book.authors.length > 0 && (
                  <span className="text-slate-400 text-xs">
                    By <strong className="text-slate-200">{book.authors[0].name}</strong>
                  </span>
                )}
              </div>

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {book.genres.map((g) => (
                    <span
                      key={g.name}
                      className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] font-medium border border-slate-700/60"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Shelf Tracking Controls Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  Personal Library Status
                </span>
                <p className="text-xs text-slate-400">
                  {shelfItem ? `Currently on your shelf: ${shelfItem.status}` : 'Not in your shelf yet'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Favorite Like Toggle */}
                {onToggleLike && (
                  <button
                    type="button"
                    onClick={() => onToggleLike(book.mal_id, book.title, poster)}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      shelfItem?.isLiked
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${shelfItem?.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{shelfItem?.isLiked ? 'Favorited' : 'Favorite'}</span>
                  </button>
                )}

                {/* Add to Playlist button */}
                <button
                  type="button"
                  onClick={() => setPlaylistModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-purple-950/30 transition-all cursor-pointer"
                  title="Add to Watchlist Playlist"
                >
                  <ListPlus className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">Add to Playlist</span>
                </button>

                {/* Remove button if on shelf */}
                {shelfItem && onRemoveFromShelf && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveFromShelf(book.mal_id);
                      onClose();
                    }}
                    className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Remove from Shelf"
                    aria-label="Remove from Shelf"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'watching' as ShelfStatus, label: 'Reading' },
                { id: 'plan_to_watch' as ShelfStatus, label: 'Plan to Read' },
                { id: 'completed' as ShelfStatus, label: 'Completed' },
                { id: 'on_hold' as ShelfStatus, label: 'On Hold' },
                { id: 'dropped' as ShelfStatus, label: 'Dropped' },
              ].map((st) => {
                const isActive = shelfItem?.status === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusChange(st.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chapter Progress Tracker */}
            {shelfItem && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-300 font-semibold">
                  Chapter Progress:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProgressChange(currentProgress - 1)}
                    disabled={currentProgress <= 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                    aria-label="Decrease chapter"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white min-w-[70px] text-center">
                    Ch. {currentProgress} / {book.chapters || '?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProgressChange(currentProgress + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    aria-label="Increase chapter"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {book.chapters && currentProgress < book.chapters && (
                    <button
                      type="button"
                      onClick={() => handleProgressChange(book.chapters!)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Overview & Synopsis Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Overview & Story Synopsis</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-56 overflow-y-auto pr-2 scrollbar-thin whitespace-pre-line">
              {cleanSynopsis(book.synopsis) || 'No detailed overview provided for this title.'}
            </p>
          </div>

          {/* Official Reading / Buy Volume Link */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Support the creators with official physical/digital volumes:
            </span>
            <a
              href={amazonSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Search Official Volumes on Amazon</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Add To Custom Playlist Modal */}
        <AddToPlaylistModal
          isOpen={playlistModalOpen}
          onClose={() => setPlaylistModalOpen(false)}
          item={book ? {
            id: book.mal_id,
            mediaType: 'manga',
            title: book.title,
            image: poster,
            score: book.score,
            genres: book.genres?.map((g) => g.name),
          } : null}
        />
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
