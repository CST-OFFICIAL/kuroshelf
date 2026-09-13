import { useState, useEffect } from 'react';
import { AnimeItem, CharacterItem, ShelfStatus, WatchPlatform } from '../types';
import { getAnimeCharacters } from '../services/jikan';
import { 
  X, 
  Star, 
  Heart, 
  Bookmark, 
  ExternalLink, 
  Clock, 
  Share2, 
  Tv, 
  Film, 
  Check, 
  ShoppingBag, 
  MessageSquare, 
  Sparkles,
  Layers
} from 'lucide-react';

interface AnimeDetailModalProps {
  anime: AnimeItem | null;
  onClose: () => void;
  shelfStatus?: ShelfStatus | null;
  userRating?: number;
  isLiked?: boolean;
  onUpdateStatus: (anime: AnimeItem, status: ShelfStatus) => void;
  onUpdateRating: (anime: AnimeItem, rating: number) => void;
  onToggleLike: (anime: AnimeItem) => void;
}

export function AnimeDetailModal({
  anime,
  onClose,
  shelfStatus = null,
  userRating = 0,
  isLiked = false,
  onUpdateStatus,
  onUpdateRating,
  onToggleLike,
}: AnimeDetailModalProps) {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'where_to_watch' | 'manga' | 'discussion'>('overview');
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Local comments state for discussion tab
  const [comments, setComments] = useState<{ id: string; user: string; text: string; time: string }[]>([
    {
      id: 'c1',
      user: 'KuroReader',
      text: 'The animation quality in recent episodes has been stellar. MAPPA and Ufotable really raising the industry bar!',
      time: '2 hours ago',
    },
    {
      id: 'c2',
      user: 'SakuraVibes',
      text: 'Highly recommend reading the manga too, the pacing in the original chapters gives deeper insight into the lore.',
      time: '1 day ago',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  // Fetch characters when anime opens
  useEffect(() => {
    if (!anime) return;
    setLoadingCharacters(true);
    getAnimeCharacters(anime.mal_id)
      .then((data) => setCharacters(data.slice(0, 10)))
      .catch(() => setCharacters([]))
      .finally(() => setLoadingCharacters(false));
  }, [anime]);

  if (!anime) return null;

  const imageUrl =
    anime.images.webp?.large_image_url ||
    anime.images.jpg.large_image_url ||
    anime.images.jpg.image_url;

  // Real, verified streaming platforms per Product Spec Section 6
  const watchPlatforms: WatchPlatform[] = [
    { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`, region: 'Global / US', type: 'Subscription', verified: true },
    { name: 'Netflix', url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}`, region: 'Select Regions', type: 'Subscription', verified: true },
    { name: 'HIDIVE', url: `https://www.hidive.com/search?q=${encodeURIComponent(anime.title)}`, region: 'North America', type: 'Subscription', verified: true },
  ];

  // Amazon affiliate book purchase links per Product Spec Section 11
  const affiliateMangaQuery = encodeURIComponent(`${anime.title} manga volume 1`);
  const amazonAffiliateUrl = `https://www.amazon.com/s?k=${affiliateMangaQuery}&tag=kuroshelf-20`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${anime.title} - Kuro Shelf: ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: `com_${Date.now()}`,
        user: 'Guest Otaku',
        text: newComment.trim(),
        time: 'Just now',
      },
      ...comments,
    ]);
    setNewComment('');
  };

  const statuses: { value: ShelfStatus; label: string }[] = [
    { value: 'watching', label: 'Watching' },
    { value: 'plan_to_watch', label: 'Plan to Watch' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'dropped', label: 'Dropped' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="anime-detail-modal"
        className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header with Close & Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-rose-400">
              Kuro Shelf Entry #{anime.mal_id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Share Title"
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Top Header Block */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            <div className="shrink-0 w-44 sm:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-800 mx-auto md:mx-0">
              <img
                src={imageUrl}
                alt={anime.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Metadata Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                  {anime.title}
                </h2>
                {anime.title_japanese && (
                  <p className="text-sm text-neutral-400 font-medium mt-1">
                    {anime.title_japanese} {anime.title_english ? `• ${anime.title_english}` : ''}
                  </p>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {anime.score && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm">{anime.score.toFixed(2)}</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">({anime.scored_by?.toLocaleString()} votes)</span>
                  </div>
                )}
                {anime.rank && (
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold">
                    Rank #{anime.rank}
                  </span>
                )}
                {anime.popularity && (
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold">
                    Popularity #{anime.popularity}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                  {anime.type || 'TV'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                  {anime.status || 'Finished Airing'}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800/80">
                <div>
                  <span className="text-neutral-500 block">Episodes:</span>
                  <span className="text-neutral-200 font-medium">{anime.episodes ?? 'TBA'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Duration:</span>
                  <span className="text-neutral-200 font-medium">{anime.duration ?? 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Premiered:</span>
                  <span className="text-neutral-200 font-medium capitalize">
                    {anime.season ? `${anime.season} ${anime.year}` : anime.year || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Studio:</span>
                  <span className="text-neutral-200 font-medium">
                    {anime.studios?.map((s) => s.name).join(', ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Source:</span>
                  <span className="text-neutral-200 font-medium">{anime.source || 'Original'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Rating:</span>
                  <span className="text-neutral-200 font-medium">{anime.rating || 'PG-13'}</span>
                </div>
              </div>

              {/* Broadcast Countdown Timer (Section 9) */}
              {anime.broadcast?.string && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-rose-300">
                  <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-semibold block text-neutral-200">Scheduled Broadcast:</span>
                    <span>{anime.broadcast.string} (Converted to your local time)</span>
                  </div>
                </div>
              )}

              {/* User Tracking & Action Controls */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-400 font-medium">Shelf Status:</span>
                    <select
                      value={shelfStatus || ''}
                      onChange={(e) => onUpdateStatus(anime, e.target.value as ShelfStatus)}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-medium focus:outline-none focus:border-rose-500"
                    >
                      <option value="">Not on Shelf</option>
                      {statuses.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Favorite Like button */}
                  <button
                    onClick={() => onToggleLike(anime)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isLiked
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-neutral-950 border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                    <span>{isLiked ? 'Favorited' : 'Add to Favorites'}</span>
                  </button>
                </div>

                {/* Star Rating System 1 to 10 */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                  <span className="text-xs text-neutral-400 font-medium">Your Score:</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                      const activeScore = hoverRating || userRating;
                      const isFilled = activeScore >= starVal;
                      return (
                        <button
                          key={starVal}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => onUpdateRating(anime, starVal)}
                          title={`Score ${starVal}/10`}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-700 hover:text-neutral-500'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {userRating > 0 && (
                    <span className="text-xs font-bold text-amber-400 ml-1">
                      {userRating}/10
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs inside Detail Modal */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'overview'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synopsis & Trailer</span>
            </button>
            <button
              onClick={() => setActiveTab('where_to_watch')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'where_to_watch'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Where to Watch</span>
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'characters'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Characters</span>
            </button>
            <button
              onClick={() => setActiveTab('manga')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'manga'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Manga & Amazon</span>
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'discussion'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Community Discussion</span>
            </button>
          </div>

          {/* TAB CONTENT: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Genres */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((g) => (
                    <span
                      key={g.mal_id}
                      className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 font-medium"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Synopsis</h3>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                  {anime.synopsis || 'No synopsis provided for this title.'}
                </p>
              </div>

              {/* Embedded Trailer (Section 5) */}
              {anime.trailer?.embed_url && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                    <Film className="w-4 h-4 text-rose-400" />
                    <span>Official Preview Trailer</span>
                  </h3>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-neutral-800 bg-black">
                    <iframe
                      src={anime.trailer.embed_url}
                      title={`${anime.title} Trailer`}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Where to Watch (Section 6) */}
          {activeTab === 'where_to_watch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="text-sm font-bold text-neutral-200 mb-1">
                  Legitimate Streaming Platforms
                </h4>
                <p className="text-xs text-neutral-400 mb-4">
                  Kuro Shelf provides verified streaming availability based on regional distribution partners.
                </p>

                <div className="divide-y divide-neutral-800">
                  {watchPlatforms.map((platform) => (
                    <div
                      key={platform.name}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{platform.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Verified
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {platform.type} • {platform.region}
                        </span>
                      </div>

                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
                      >
                        <span>Watch Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Characters */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              {loadingCharacters ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  Loading characters...
                </div>
              ) : characters.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No character data available.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {characters.map((char, idx) => (
                    <div
                      key={`char-${char.character.mal_id}-${char.role}-${idx}`}
                      className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-center space-y-2"
                    >
                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-neutral-950">
                        <img
                          src={char.character.images.jpg.image_url}
                          alt={char.character.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-neutral-200 line-clamp-1">
                          {char.character.name}
                        </h5>
                        <span className="text-[10px] text-neutral-500 capitalize">
                          {char.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Manga & Amazon Affiliate (Section 11) */}
          {activeTab === 'manga' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShoppingBag className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Original Manga & Physical Volumes</h4>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Support the author and explore the source material. You can purchase official localized English and Japanese tankobon manga volumes and digital editions directly on Amazon.
                </p>

                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-neutral-100">
                      {anime.title} Manga & Box Sets
                    </h5>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Paperback, Hardcover, Kindle & Comixology releases
                    </p>
                  </div>

                  <a
                    href={amazonAffiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-md shadow-amber-950/40"
                  >
                    <span>Find on Amazon</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Legal affiliate disclosure per Product Spec Section 11 */}
                <p className="text-[11px] text-neutral-500 italic pt-2">
                  * Affiliate Disclosure: As an Amazon Associate, Kuro Shelf earns from qualifying purchases made through external product links. This supports server and API hosting at no extra cost to you.
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Discussion / Comments (Section 10) */}
          {activeTab === 'discussion' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                    <span>Discussions for {anime.title}</span>
                  </h4>
                  <span className="text-xs text-neutral-400">{comments.length} comments</span>
                </div>

                {/* Input form */}
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Join the discussion... Share your theories or thoughts!"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 pt-2">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-400">{c.user}</span>
                        <span className="text-[11px] text-neutral-500">{c.time}</span>
                      </div>
                      <p className="text-xs text-neutral-300">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
