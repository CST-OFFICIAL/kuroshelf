import { useState, useEffect } from 'react';
import {
  X,
  Star,
  Bookmark,
  Heart,
  Share2,
  ExternalLink,
  Clock,
  Tv,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Film,
  Check,
  Layers,
  GitFork,
  Radio,
} from 'lucide-react';
import { AnimeItem, CharacterItem, ShelfStatus, WatchPlatform } from '../types';
import { getAnimeCharacters, getAnimeById } from '../services/jikan';
import { siteConfig } from '../config/site';
import { MediaImage } from './MediaImage';

interface AnimeDetailModalProps {
  anime: AnimeItem | null;
  shelfStatus?: ShelfStatus;
  userRating?: number;
  isLiked?: boolean;
  onClose: () => void;
  onUpdateStatus: (anime: AnimeItem, status: ShelfStatus) => void;
  onUpdateRating: (anime: AnimeItem, rating: number) => void;
  onToggleLike: (anime: AnimeItem) => void;
  onSelectRelatedAnime?: (malId: number) => void;
}

export function AnimeDetailModal({
  anime: initialAnime,
  shelfStatus,
  userRating = 0,
  isLiked = false,
  onClose,
  onUpdateStatus,
  onUpdateRating,
  onToggleLike,
  onSelectRelatedAnime,
}: AnimeDetailModalProps) {
  const [anime, setAnime] = useState<AnimeItem | null>(initialAnime);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'relations' | 'where_to_watch' | 'manga' | 'discussion'>('overview');
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Sync initial anime and fetch full details (relations, streaming) if needed
  useEffect(() => {
    setAnime(initialAnime);
    if (!initialAnime) return;

    // Fetch full details if relations or streaming aren't present
    getAnimeById(initialAnime.mal_id)
      .then((fullData) => {
        if (fullData) {
          setAnime((prev) => (prev && prev.mal_id === fullData.mal_id ? { ...prev, ...fullData } : prev));
        }
      })
      .catch((err) => console.warn('[Modal Details Fetch] Notice:', err));
  }, [initialAnime]);

  // Fetch characters when anime opens
  useEffect(() => {
    if (!anime) return;
    setLoadingCharacters(true);
    getAnimeCharacters(anime.mal_id)
      .then((data) => setCharacters(data.slice(0, 12)))
      .catch(() => setCharacters([]))
      .finally(() => setLoadingCharacters(false));
  }, [anime?.mal_id]);

  // Dynamic countdown timer if reliable date/time exists
  useEffect(() => {
    if (!anime) {
      setCountdown(null);
      return;
    }

    let targetDate: Date | null = null;

    // 1. If not yet aired and has aired.from ISO date
    if (anime.status === 'Not yet aired' && anime.aired?.from) {
      const parsed = new Date(anime.aired.from);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        targetDate = parsed;
      }
    }

    // 2. If currently airing and has broadcast day/time in JST
    if (!targetDate && anime.status === 'Currently Airing' && anime.broadcast?.day && anime.broadcast?.time) {
      // Calculate next occurrence of this broadcast day and time (JST is UTC+9)
      try {
        const daysMap: Record<string, number> = {
          sundays: 0,
          mondays: 1,
          tuesdays: 2,
          wednesdays: 3,
          thursdays: 4,
          fridays: 5,
          saturdays: 6,
        };
        const targetDay = daysMap[anime.broadcast.day.toLowerCase().trim()];
        const [hoursStr, minutesStr] = anime.broadcast.time.split(':');
        const targetHourJST = parseInt(hoursStr, 10);
        const targetMinJST = parseInt(minutesStr, 10);

        if (targetDay !== undefined && !isNaN(targetHourJST) && !isNaN(targetMinJST)) {
          const now = new Date();
          // Current time in JST
          const nowUtc = now.getTime() + now.getTimezoneOffset() * 60000;
          const jstNow = new Date(nowUtc + 9 * 3600000);

          const nextBroadcastJst = new Date(jstNow);
          const currentDay = jstNow.getDay();
          let dayDiff = (targetDay - currentDay + 7) % 7;
          nextBroadcastJst.setHours(targetHourJST, targetMinJST, 0, 0);

          if (dayDiff === 0 && nextBroadcastJst.getTime() <= jstNow.getTime()) {
            dayDiff = 7;
          }
          nextBroadcastJst.setDate(jstNow.getDate() + dayDiff);

          // Convert JST back to local time
          const nextBroadcastUtc = nextBroadcastJst.getTime() - 9 * 3600000;
          targetDate = new Date(nextBroadcastUtc);
        }
      } catch {
        targetDate = null;
      }
    }

    if (!targetDate) {
      setCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = targetDate!.getTime() - Date.now();
      if (remainingMs <= 0) {
        setCountdown(null);
        clearInterval(interval);
        return;
      }

      const totalSec = Math.floor(remainingMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [anime?.status, anime?.aired?.from, anime?.broadcast?.day, anime?.broadcast?.time]);

  // Lazy load Disqus comments when discussion tab opens
  useEffect(() => {
    if (activeTab !== 'discussion' || !anime || !siteConfig.disqusShortname) return;

    // Setup Disqus global configuration
    const shortname = siteConfig.disqusShortname;
    const identifier = `kuroshelf-anime-${anime.mal_id}`;
    const pageUrl = `${window.location.origin}/anime/${anime.mal_id}`;
    const pageTitle = `${anime.title} — Kuro Shelf`;

    (window as unknown as { disqus_config: () => void }).disqus_config = function (this: { page: { url: string; identifier: string; title: string } }) {
      this.page.url = pageUrl;
      this.page.identifier = identifier;
      this.page.title = pageTitle;
    };

    const existingScript = document.getElementById('disqus-script');
    if (!existingScript) {
      const dsq = document.createElement('script');
      dsq.id = 'disqus-script';
      dsq.type = 'text/javascript';
      dsq.async = true;
      dsq.src = `https://${shortname}.disqus.com/embed.js`;
      dsq.setAttribute('data-timestamp', String(+new Date()));
      (document.head || document.body).appendChild(dsq);
    } else {
      // Reload disqus if DISQUS is already instantiated
      const win = window as unknown as { DISQUS?: { reset: (opts: unknown) => void } };
      if (win.DISQUS) {
        win.DISQUS.reset({
          reload: true,
          config: function () {
            const config = this as { page: { url: string; identifier: string; title: string } };
            config.page.url = pageUrl;
            config.page.identifier = identifier;
            config.page.title = pageTitle;
          },
        });
      }
    }
  }, [activeTab, anime?.mal_id, anime?.title]);

  if (!anime) return null;

  // Build where to watch list
  const directStreamingLinks = anime.streaming || [];
  const searchPlatforms: WatchPlatform[] = [
    { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`, region: 'Global / US', type: 'Platform Search', isOfficialSearchDirectory: true },
    { name: 'Netflix', url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}`, region: 'Select Regions', type: 'Platform Search', isOfficialSearchDirectory: true },
    { name: 'HIDIVE', url: `https://www.hidive.com/search?q=${encodeURIComponent(anime.title)}`, region: 'North America', type: 'Platform Search', isOfficialSearchDirectory: true },
  ];

  // Amazon retail book search
  const affiliateMangaQuery = encodeURIComponent(`${anime.title} manga volume 1`);
  const amazonAffiliateUrl = siteConfig.affiliate.amazonAssociatesActive && siteConfig.affiliate.amazonTag
    ? `https://www.amazon.com/s?k=${affiliateMangaQuery}&tag=${siteConfig.affiliate.amazonTag}`
    : `https://www.amazon.com/s?k=${affiliateMangaQuery}`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${anime.title} - Kuro Shelf: ${window.location.origin}/anime/${anime.mal_id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {anime.type || 'Anime'}
            </span>
            {anime.status && (
              <span className="text-xs font-medium text-neutral-400">
                • {anime.status}
              </span>
            )}
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
              title="Close Modal"
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
            <div className="shrink-0 w-44 sm:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-800 mx-auto md:mx-0 bg-neutral-900">
              <MediaImage
                malId={anime.mal_id}
                images={anime.images}
                alt={anime.title}
                title={anime.title}
                mediaType="anime"
                aspectRatio="aspect-[2/3]"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Metadata Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                  {anime.title}
                </h2>
                {(anime.title_japanese || anime.title_english) && (
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
                    {anime.scored_by ? (
                      <span className="text-[10px] text-amber-400/80 font-normal">({anime.scored_by.toLocaleString()} votes)</span>
                    ) : null}
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

              {/* Countdown or Scheduled Broadcast */}
              {countdown ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold block text-neutral-200">
                      {anime.status === 'Not yet aired' ? 'Upcoming Premiere Countdown:' : 'Next Episode Broadcast in:'}
                    </span>
                    <div className="flex items-center gap-2 mt-1 font-mono text-sm font-bold text-rose-300">
                      <span>{countdown.days}d</span>
                      <span>:</span>
                      <span>{String(countdown.hours).padStart(2, '0')}h</span>
                      <span>:</span>
                      <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                      <span>:</span>
                      <span>{String(countdown.seconds).padStart(2, '0')}s</span>
                    </div>
                  </div>
                  {anime.broadcast?.string && (
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">
                      {anime.broadcast.string}
                    </span>
                  )}
                </div>
              ) : anime.broadcast?.string ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-rose-300">
                  <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-semibold block text-neutral-200">Scheduled Broadcast (JST):</span>
                    <span>{anime.broadcast.string}</span>
                  </div>
                </div>
              ) : null}

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
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('where_to_watch')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'where_to_watch'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Where to Watch</span>
            </button>
            <button
              onClick={() => setActiveTab('relations')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'relations'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Relations & Sequels</span>
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
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
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'manga'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Source Manga</span>
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'discussion'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discussion</span>
            </button>
          </div>

          {/* TAB CONTENT: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Genres & Themes */}
              {((anime.genres && anime.genres.length > 0) || (anime.themes && anime.themes.length > 0)) && (
                <div className="flex flex-wrap gap-2">
                  {anime.genres?.map((g) => (
                    <span
                      key={`genre-${g.mal_id}`}
                      className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 font-medium"
                    >
                      {g.name}
                    </span>
                  ))}
                  {anime.themes?.map((t) => (
                    <span
                      key={`theme-${t.mal_id}`}
                      className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900/60 text-neutral-400 border border-neutral-800 font-medium"
                    >
                      #{t.name}
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

              {/* Embedded Trailer */}
              {anime.trailer?.embed_url && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                    <Film className="w-4 h-4 text-rose-400" />
                    <span>Official Trailer</span>
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

          {/* TAB CONTENT: Where to Watch */}
          {activeTab === 'where_to_watch' && (
            <div className="space-y-4">
              {/* Official Direct Streaming Links (if returned by Jikan) */}
              {directStreamingLinks.length > 0 && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-900/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="text-sm font-bold text-white">Direct Streaming Providers</h4>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Official streaming links reported for this title by the catalog:
                  </p>
                  <div className="divide-y divide-neutral-800">
                    {directStreamingLinks.map((provider) => (
                      <div key={provider.name} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{provider.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                            Verified Provider
                          </span>
                        </div>
                        <a
                          href={provider.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                        >
                          <span>Watch Title</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streaming Platform Directories */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="text-sm font-bold text-neutral-200 mb-1">
                  Platform Search Directories
                </h4>
                <p className="text-xs text-neutral-400 mb-4">
                  Licensing and catalog availability vary by country and region. Use the official directories below to search catalog availability in your region:
                </p>

                <div className="divide-y divide-neutral-800">
                  {searchPlatforms.map((platform) => (
                    <div
                      key={platform.name}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{platform.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                            Search Directory
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {platform.type} • {platform.region}
                        </span>
                      </div>

                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
                      >
                        <span>Search Catalog</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Relations & Sequels */}
          {activeTab === 'relations' && (
            <div className="space-y-4">
              {anime.relations && anime.relations.length > 0 ? (
                <div className="space-y-4">
                  {anime.relations.map((rel, rIdx) => (
                    <div key={`${rel.relation}-${rIdx}`} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <GitFork className="w-4 h-4 text-rose-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                          {rel.relation}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {rel.entry.map((ent) => {
                          const isAnime = ent.type === 'anime';
                          return (
                            <div
                              key={`${ent.type}-${ent.mal_id}`}
                              className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                                  {ent.type}
                                </span>
                                <p className="text-xs font-semibold text-neutral-200 truncate" title={ent.name}>
                                  {ent.name}
                                </p>
                              </div>
                              {isAnime && onSelectRelatedAnime ? (
                                <button
                                  onClick={() => onSelectRelatedAnime(ent.mal_id)}
                                  className="px-2.5 py-1 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white text-[11px] font-medium transition-colors shrink-0"
                                >
                                  View
                                </button>
                              ) : (
                                <a
                                  href={ent.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
                                  title="External source link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-neutral-400 text-xs">
                  No franchise relations or adaptations reported for this title.
                </div>
              )}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {characters.map((char, idx) => (
                    <div
                      key={`char-${char.character.mal_id}-${char.role}-${idx}`}
                      className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-center space-y-2"
                    >
                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-neutral-950">
                        <MediaImage
                          malId={char.character.mal_id}
                          images={char.character.images}
                          alt={char.character.name}
                          title={char.character.name}
                          mediaType="character"
                          aspectRatio="aspect-square"
                          loading="lazy"
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

          {/* TAB CONTENT: Source Manga & Amazon */}
          {activeTab === 'manga' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShoppingBag className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Source Manga & Publications</h4>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Support official authors and distributors. You can check official localized English and Japanese tankobon volumes, digital releases, and light novels on Amazon.
                </p>

                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-neutral-100">
                      {anime.title} Publications
                    </h5>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Paperback, Hardcover, Kindle & Comixology editions
                    </p>
                  </div>

                  <a
                    href={amazonAffiliateUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-md shadow-amber-950/40"
                  >
                    <span>Check on Amazon</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {siteConfig.affiliate.amazonAssociatesActive && (
                  <p className="text-[11px] text-neutral-500 italic pt-2">
                    * Affiliate Disclosure: As an Amazon Associate, Kuro Shelf earns from qualifying purchases made through external product links.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Discussion / Comments */}
          {activeTab === 'discussion' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                    <span>Community Discussion</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
                    Disqus Thread
                  </span>
                </div>

                {siteConfig.disqusShortname ? (
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    <div id="disqus_thread" />
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs leading-relaxed space-y-3">
                    <p className="text-neutral-300">
                      Community discussions and episode reaction threads for Kuro Shelf titles are integrated via <strong className="text-rose-400 font-medium">Disqus</strong>.
                    </p>
                    <div className="p-3 rounded-md bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                      <p className="font-medium text-neutral-200">Thread Identifier: {anime.title}</p>
                      <p>
                        The live Disqus comments component will render automatically as soon as the <code className="text-rose-300">VITE_DISQUS_SHORTNAME</code> environment variable is set for your deployed domain. No mock comments are fabricated.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
