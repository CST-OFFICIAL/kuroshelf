import { CommentSection } from './CommentSection';
import { useState, useEffect } from 'react';
import { cleanSynopsis } from '../utils/textUtils';
import {
  X,
  Star,
  CheckCircle2,
  Info,
  BookOpen,
  Bookmark,
  Heart,
  Share2,
  ExternalLink,
  Clock,
  Tv,
  ShoppingBag,
  Film,
  Layers,
  GitFork,
  Radio,
  Sparkles,
  Mic,
  Compass,
} from 'lucide-react';
import { AnimeItem, CharacterItem, ShelfStatus, WatchPlatform, RecommendedAnimeItem } from '../types';
import { getAnimeCharacters, getAnimeById, getAnimeRecommendations } from '../services/jikan';
import { siteConfig } from '../config/site';

import { MediaImage } from './MediaImage';

import { AuthUser } from '../types';

interface AnimeDetailModalProps {
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  anime: AnimeItem | null;
  shelfStatus?: ShelfStatus;
  userRating?: number;
  isLiked?: boolean;
  onClose: () => void;
  onUpdateStatus: (anime: AnimeItem, status: ShelfStatus) => void;
  onUpdateRating: (anime: AnimeItem, rating: number) => void;
  onToggleLike: (anime: AnimeItem) => void;
  onSelectRelatedAnime?: (malId: number) => void;
  onSelectCharacter?: (characterId: number, characterName: string) => void;
  onSelectVoiceActor?: (personId: number, personName: string) => void;
  onSelectGenre?: (genreName: string) => void;
  onSelectStudio?: (studioName: string) => void;
  onSelectYear?: (year: number, season?: string) => void;
  onNavigateToManga?: (mangaTitle: string) => void;
}

export function AnimeDetailModal({
  currentUser = null,
  onOpenAuth = () => {},
  anime: initialAnime,
  shelfStatus,
  userRating = 0,
  isLiked = false,
  onClose,
  onUpdateStatus,
  onUpdateRating,
  onToggleLike,
  onSelectRelatedAnime,
  onSelectCharacter,
  onSelectVoiceActor,
  onSelectGenre,
  onSelectStudio,
  onSelectYear,
  onNavigateToManga,
}: AnimeDetailModalProps) {
  const [anime, setAnime] = useState<AnimeItem | null>(initialAnime);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedAnimeItem[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'relations' | 'where_to_watch' | 'manga' | 'discussion' | 'recommendations'>('overview');
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [communityScore, setCommunityScore] = useState<{ score: number | null, users: number } | null>(null);
  const [liveSynopsis, setLiveSynopsis] = useState<string | null>(initialAnime?.synopsis || null);

  // Safety check: instantly close if adult or specifically blocked hentai title
  useEffect(() => {
    if (!initialAnime) return;
    const malId = Number(initialAnime.mal_id);
    const title = `${initialAnime.title || ''} ${initialAnime.title_english || ''}`.toLowerCase();
    const rating = String(initialAnime.rating || '').toLowerCase();
    if (
      malId === 34246 ||
      title.includes('rina witch') ||
      title.includes('kimi no mana wa') ||
      rating.includes('rx') ||
      rating.includes('hentai')
    ) {
      onClose();
    }
  }, [initialAnime, onClose]);

  // Lock body and html scroll
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody || '';
      document.documentElement.style.overflow = prevHtml || '';
    };
  }, []);

  useEffect(() => {
    setLiveSynopsis(initialAnime?.synopsis || null);

    // If synopsis is missing or a placeholder stub, automatically fetch the official publisher synopsis
    const raw = initialAnime?.synopsis?.trim() || '';
    const isStub = !raw || raw.length < 50 || raw.toLowerCase().includes('second season of') || raw.toLowerCase().includes('sequel to');
    if (isStub && initialAnime?.mal_id) {
      fetch(`/api/anime/${initialAnime.mal_id}/synopsis/official`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: initialAnime.title }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.synopsis) {
            setLiveSynopsis(data.synopsis);
            setAnime((prev) => (prev ? { ...prev, synopsis: data.synopsis } : prev));
          }
        })
        .catch(() => {});
    }
  }, [initialAnime?.mal_id, initialAnime?.synopsis, initialAnime?.title]);


  const handleCopyLink = () => {
    if (!anime) return;
    const url = `${window.location.origin}/anime/${anime.mal_id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

  // Fetch community score
  useEffect(() => {
    if (!anime) return;
    fetch(`/api/ratings/community/anime/${anime.mal_id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setCommunityScore(res.data);
        }
      })
      .catch(err => console.warn('Community score fetch error', err));
  }, [anime?.mal_id]);

  // Fetch characters when anime opens
  useEffect(() => {
    if (!anime) return;
    setLoadingCharacters(true);
    getAnimeCharacters(anime.mal_id)
      .then((data) => setCharacters(data.slice(0, 16)))
      .catch(() => setCharacters([]))
      .finally(() => setLoadingCharacters(false));
  }, [anime?.mal_id]);

  // Fetch recommendations when anime opens
  useEffect(() => {
    if (!anime?.mal_id) {
      setRecommendations([]);
      return;
    }
    setLoadingRecommendations(true);
    getAnimeRecommendations(anime.mal_id)
      .then((data) => setRecommendations(data || []))
      .catch(() => setRecommendations([]))
      .finally(() => setLoadingRecommendations(false));
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


  const statuses: { value: ShelfStatus; label: string }[] = [
    { value: 'watching', label: 'Watching' },
    { value: 'plan_to_watch', label: 'Plan to Watch' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'dropped', label: 'Dropped' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="anime-detail-modal"
        className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Header with Close & Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900 sticky top-0 z-20">
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
              onClick={handleCopyLink}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Copy Link"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
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
                {anime.title_english && anime.title_english !== anime.title && (
                  <p className="text-sm text-neutral-300 font-medium mt-1">
                    {anime.title_english}
                  </p>
                )}
                {anime.title_japanese && (
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {anime.title_japanese}
                  </p>
                )}
              </div>

              {/* Prominent Genres, Demographics & Themes Badges */}
              {((anime.genres && anime.genres.length > 0) || (anime.demographics && anime.demographics.length > 0) || (anime.themes && anime.themes.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {anime.demographics?.map((d, i) => (
                    <button
                      key={`modal-top-demo-${d.name || i}`}
                      type="button"
                      onClick={() => {
                        if (onSelectGenre && d.name) {
                          onClose();
                          onSelectGenre(d.name);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all ${
                        onSelectGenre
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400 hover:text-amber-200 cursor-pointer'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                      title={`Filter by demographic: ${d.name}`}
                    >
                      <span>{d.name}</span>
                    </button>
                  ))}
                  {anime.genres?.map((g, i) => (
                    <button
                      key={`modal-top-genre-${g.name || i}`}
                      type="button"
                      onClick={() => {
                        if (onSelectGenre && g.name) {
                          onClose();
                          onSelectGenre(g.name);
                        }
                      }}
                      className={`inline-flex items-center px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                        onSelectGenre
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 hover:text-white hover:border-rose-400 cursor-pointer'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                      title={`Filter by genre: ${g.name}`}
                    >
                      <span>{g.name}</span>
                    </button>
                  ))}
                  {anime.themes?.slice(0, 4).map((t, i) => (
                    <button
                      key={`modal-top-theme-${t.name || i}`}
                      type="button"
                      onClick={() => {
                        if (onSelectGenre && t.name) {
                          onClose();
                          onSelectGenre(t.name);
                        }
                      }}
                      className={`inline-flex items-center px-2 py-1 text-xs rounded-lg font-normal border transition-all ${
                        onSelectGenre
                          ? 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700 cursor-pointer'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                      title={`Filter by theme: ${t.name}`}
                    >
                      <span>#{t.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  {communityScore?.score !== null && communityScore?.score !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold" title="Kuro Shelf Rating">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-rose-400 text-rose-400" />
                        <span className="text-sm">{communityScore.score.toFixed(2)}</span>
                      </div>
                      <span className="text-xs font-semibold text-rose-200">Kuro Shelf Rating</span>
                      <span className="text-[10px] text-rose-400/80 font-normal">({communityScore.users} KS user{communityScore.users !== 1 ? 's' : ''})</span>
                    </div>
                  )}
                  {anime.score && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold" title="Global Rating">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{anime.score.toFixed(2)}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-200">Global Rating</span>
                      {anime.scored_by ? (
                        <span className="text-[10px] text-amber-400/80 font-normal">({anime.scored_by.toLocaleString()} global votes)</span>
                      ) : null}
                    </div>
                  )}
                </div>
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
                  <span className="text-neutral-400 block">Episodes:</span>
                  <span className="text-neutral-200 font-medium">{anime.episodes ?? 'TBA'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Duration:</span>
                  <span className="text-neutral-200 font-medium">{anime.duration ?? 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Premiered:</span>
                  {anime.season || anime.year ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (anime.year && onSelectYear) {
                          onClose();
                          onSelectYear(anime.year, anime.season);
                        }
                      }}
                      className={`font-medium capitalize text-left transition-colors ${
                        onSelectYear && anime.year
                          ? 'text-neutral-200 hover:text-rose-400 underline decoration-dotted underline-offset-2 cursor-pointer'
                          : 'text-neutral-200'
                      }`}
                      title={anime.year ? `View rankings for year ${anime.year}` : undefined}
                    >
                      {anime.season ? `${anime.season} ${anime.year}` : anime.year}
                    </button>
                  ) : (
                    <span className="text-neutral-200 font-medium">N/A</span>
                  )}
                </div>
                <div>
                  <span className="text-neutral-400 block">Studio:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {anime.studios && anime.studios.length > 0 ? (
                      anime.studios.map((s, idx) => (
                        <span key={s.mal_id || s.name || idx}>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectStudio && s.name) {
                                onClose();
                                onSelectStudio(s.name);
                              }
                            }}
                            className={`font-medium transition-colors ${
                              onSelectStudio
                                ? 'text-neutral-200 hover:text-rose-400 underline decoration-dotted underline-offset-2 cursor-pointer'
                                : 'text-neutral-200'
                            }`}
                            title={`Search titles produced by studio ${s.name}`}
                          >
                            {s.name}
                          </button>
                          {idx < (anime.studios?.length ?? 1) - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-200 font-medium">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-400 block">Source:</span>
                  <span className="text-neutral-200 font-medium">{anime.source || 'Original'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Rating:</span>
                  <span className="text-neutral-200 font-medium">{anime.rating || 'Not Rated'}</span>
                </div>
                {/* Genres row in metadata */}
                {((anime.genres && anime.genres.length > 0) || (anime.demographics && anime.demographics.length > 0)) && (
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1 font-semibold text-[11px] uppercase tracking-wider">Genres & Categories:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {anime.demographics?.map((d, i) => (
                        <button
                          key={`meta-demo-${d.name || i}`}
                          type="button"
                          onClick={() => {
                            if (onSelectGenre && d.name) {
                              onClose();
                              onSelectGenre(d.name);
                            }
                          }}
                          className={`text-xs px-2 py-0.5 rounded-md font-semibold transition-colors ${
                            onSelectGenre
                              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 cursor-pointer'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                      {anime.genres?.map((g, i) => (
                        <button
                          key={`meta-genre-${g.name || i}`}
                          type="button"
                          onClick={() => {
                            if (onSelectGenre && g.name) {
                              onClose();
                              onSelectGenre(g.name);
                            }
                          }}
                          className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors ${
                            onSelectGenre
                              ? 'bg-neutral-800 text-neutral-200 hover:text-rose-300 hover:bg-neutral-700 cursor-pointer'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown or Scheduled Broadcast */}
              {countdown ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
                  <Radio className="w-4 h-4 text-rose-400 shrink-0" />
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
                    className={`p-1.5 rounded-lg border transition-all ${
                      isLiked
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
                    }`}
                    title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
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
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => onUpdateRating(anime, userRating === starVal ? 0 : starVal)}
                          className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isFilled ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
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
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs font-medium overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
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
              <span>Watch</span>
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
              <span>Relations</span>
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
              <span>Characters & VA</span>
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'recommendations'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommendations ({recommendations.length})</span>
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
          </div>

          {/* TAB CONTENT: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Genres, Demographics & Themes */}
              {((anime.genres && anime.genres.length > 0) || (anime.themes && anime.themes.length > 0) || (anime.demographics && anime.demographics.length > 0)) && (
                <div className="space-y-3 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-neutral-300 text-xs font-bold uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-rose-500" />
                    <span>Genres & Themes</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {anime.demographics?.map((d, i) => (
                      <button
                        key={`tab-demo-${d.name || i}`}
                        type="button"
                        onClick={() => {
                          if (onSelectGenre && d.name) {
                            onClose();
                            onSelectGenre(d.name);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1.5 border transition-all ${
                          onSelectGenre
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400 hover:text-amber-200 cursor-pointer'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                        title={`Explore ${d.name} anime`}
                      >
                        <span>{d.name}</span>
                        <span className="text-[10px] text-amber-400/70 font-normal">demographic</span>
                      </button>
                    ))}
                    {anime.genres?.map((g, i) => (
                      <button
                        key={`tab-genre-${g.name || i}`}
                        type="button"
                        onClick={() => {
                          if (onSelectGenre && g.name) {
                            onClose();
                            onSelectGenre(g.name);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                          onSelectGenre
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 hover:text-white hover:border-rose-400 cursor-pointer'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                        title={`Explore ${g.name} anime`}
                      >
                        {g.name}
                      </button>
                    ))}
                    {anime.themes?.map((t, i) => (
                      <button
                        key={`tab-theme-${t.name || i}`}
                        type="button"
                        onClick={() => {
                          if (onSelectGenre && t.name) {
                            onClose();
                            onSelectGenre(t.name);
                          }
                        }}
                        className={`px-2.5 py-1.5 text-xs rounded-lg font-normal border transition-all ${
                          onSelectGenre
                            ? 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700 cursor-pointer'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                        title={`Explore #${t.name} titles`}
                      >
                        #{t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Publisher Synopsis */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Synopsis</h3>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                  {cleanSynopsis(liveSynopsis || anime.synopsis) || 'No synopsis provided for this title.'}
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

              {/* Native Comment Section inside Overview */}
              <div className="pt-8 mt-8 border-t border-neutral-800">
                <CommentSection mediaId={anime.mal_id} currentUser={currentUser} onOpenAuth={onOpenAuth} />
              </div>
            </div>
          )}

          {/* TAB CONTENT: Where to Watch */}
          {activeTab === 'where_to_watch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2 mb-4">
                  <Tv className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-white">Streaming Availability</h3>
                </div>
                {directStreamingLinks.length > 0 ? (
                  <>
                    <p className="text-xs text-neutral-400 mb-2">
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
                  </>
                ) : (
                  <p className="text-sm text-neutral-400">No official streaming links reported for this title.</p>
                )}
              </div>
              
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
                  {anime.relations.map((rel) => (
                    <div key={rel.relation} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <GitFork className="w-4 h-4 text-rose-400" />
                        <h4 className="font-bold text-white text-sm">{rel.relation}</h4>
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
                                <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                  {ent.type}
                                </span>
                                <p className="text-xs font-semibold text-neutral-200 truncate" title={ent.name}>
                                  {ent.name}
                                </p>
                              </div>
                              {ent.type === 'manga' && onNavigateToManga ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigateToManga(ent.name);
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors shrink-0"
                                  title="Search and track in Manga Shelf"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Find Manga</span>
                                </button>
                              ) : isAnime && onSelectRelatedAnime ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectRelatedAnime(ent.mal_id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-rose-300 text-xs font-semibold transition-colors shrink-0"
                                  title="View Anime Details"
                                >
                                  <span>View Anime</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <a
                                  href={ent.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="p-1 text-neutral-400 hover:text-neutral-300 transition-colors shrink-0"
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

          {/* TAB CONTENT: Characters & Voice Actors */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              {loadingCharacters ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-neutral-800 border-t-rose-500 rounded-full animate-spin" />
                </div>
              ) : characters.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No character data available for this title.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {characters.map((char, idx) => {
                    const primaryVa = char.voice_actors && char.voice_actors.length > 0
                      ? char.voice_actors.find(v => v.language?.toLowerCase().includes('japanese')) || char.voice_actors[0]
                      : null;

                    return (
                      <div
                        key={`char-${char.character.mal_id}-${char.role}-${idx}`}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
                      >
                        {/* Character Top Row */}
                        <div
                          onClick={() => onSelectCharacter && onSelectCharacter(char.character.mal_id, char.character.name)}
                          className="flex items-center gap-3 cursor-pointer group/char"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
                            <MediaImage
                              malId={char.character.mal_id}
                              images={char.character.images}
                              alt={char.character.name}
                              title={char.character.name}
                              mediaType="character"
                              aspectRatio="aspect-square"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover/char:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-neutral-200 group-hover/char:text-rose-400 line-clamp-1 transition-colors">
                              {char.character.name}
                            </h5>
                            <span className="text-[10px] text-neutral-400 capitalize block">
                              {char.role} Role
                            </span>
                            <span className="text-[9px] text-rose-400/80 font-medium hover:underline inline-block mt-0.5">
                              Explore Character →
                            </span>
                          </div>
                        </div>

                        {/* Voice Actor Row if available */}
                        {primaryVa && (
                          <div
                            onClick={() => onSelectVoiceActor && onSelectVoiceActor(primaryVa.person.mal_id, primaryVa.person.name)}
                            className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-950 hover:border-neutral-700 border border-transparent cursor-pointer group/va transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {primaryVa.person.images?.jpg?.image_url ? (
                                <img
                                  src={primaryVa.person.images.jpg.image_url}
                                  alt={primaryVa.person.name}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-full object-cover bg-neutral-900 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                                  <Mic className="w-3.5 h-3.5 text-neutral-500" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-semibold text-neutral-300 group-hover/va:text-rose-400 truncate transition-colors">
                                  {primaryVa.person.name}
                                </div>
                                <div className="text-[9px] text-neutral-500">
                                  {primaryVa.language} Seiyuu
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-medium text-neutral-400 group-hover/va:text-white px-1.5 py-0.5 bg-neutral-800 rounded">
                              VA
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Recommendations */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>Recommended If You Liked This Title</span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Curated affinities and community matches based on themes, genres, and audience ratings.
                  </p>
                </div>
              </div>

              {loadingRecommendations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-neutral-800 border-t-rose-500 rounded-full animate-spin" />
                </div>
              ) : recommendations.length === 0 ? (
                <div className="p-8 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-neutral-400 text-xs">
                  No community recommendations available for this title yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {recommendations.map((rec) => (
                    <div
                      key={`rec-${rec.mal_id}`}
                      onClick={() => onSelectRelatedAnime && onSelectRelatedAnime(rec.mal_id)}
                      className="group bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-neutral-950 relative">
                        <img
                          src={rec.image_url}
                          alt={rec.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {rec.score && (
                          <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            {rec.score}
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h5 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                          {rec.title_english || rec.title}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                          <span>{rec.format || 'Anime'}</span>
                          {rec.votes ? <span>{rec.votes} votes</span> : null}
                        </div>
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
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-white text-lg">Manga & Light Novels</h3>
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

                  <div className="flex flex-wrap items-center gap-2">
                    {onNavigateToManga && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToManga(anime.title);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/40"
                        title="View chapters, authors, and track on your Kuro Shelf"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Search Manga Shelf</span>
                      </button>
                    )}

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
                </div>

                {siteConfig.affiliate.amazonAssociatesActive && (
                  <p className="text-[11px] text-neutral-400 italic pt-2">
                    * Affiliate Disclosure: As an Amazon Associate, Kuro Shelf earns from qualifying purchases made through external product links.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
