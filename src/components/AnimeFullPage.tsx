import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Heart,
  Check,
  Share2,
  CheckCircle2,
  ExternalLink,
  Film,
  Tv,
  Layers,
  GitFork,
  ShoppingBag,
  Sparkles,
  Clock,
  Building2,
  Info,
  Radio,
} from 'lucide-react';
import { AnimeItem, CharacterItem, ShelfStatus, RecommendedAnimeItem, AuthUser, WatchPlatform } from '../types';
import { getAnimeCharacters, getAnimeById, getAnimeRecommendations } from '../services/jikan';
import { MediaImage } from './MediaImage';
import { CommentSection } from './CommentSection';
import { cleanSynopsis } from '../utils/textUtils';
import { formatOverallRank } from '../utils/rankHelper';
import { getFranchiseSeasons, FranchiseSeasonItem } from '../services/franchiseService';

interface AnimeFullPageProps {
  anime: AnimeItem;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  onBack: () => void;
  shelfStatus?: ShelfStatus;
  userRating?: number;
  isLiked?: boolean;
  onUpdateStatus: (anime: AnimeItem, status: ShelfStatus) => void;
  onUpdateRating: (anime: AnimeItem, rating: number) => void;
  onToggleLike: (anime: AnimeItem) => void;
  onSelectAnime?: (anime: AnimeItem) => void;
  onSelectGenre?: (genreName: string) => void;
  onSelectStudio?: (studioName: string) => void;
}

export function AnimeFullPage({
  anime: initialAnime,
  currentUser = null,
  onOpenAuth = () => {},
  onBack,
  shelfStatus,
  userRating = 0,
  isLiked = false,
  onUpdateStatus,
  onUpdateRating,
  onToggleLike,
  onSelectAnime,
  onSelectGenre,
  onSelectStudio,
}: AnimeFullPageProps) {
  const [anime, setAnime] = useState<AnimeItem>(initialAnime);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedAnimeItem[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'seasons' | 'characters' | 'relations' | 'where_to_watch' | 'manga' | 'discussion' | 'recommendations'>('overview');
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [liveSynopsis, setLiveSynopsis] = useState<string | null>(initialAnime?.synopsis || null);
  const [franchiseSeasons, setFranchiseSeasons] = useState<FranchiseSeasonItem[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  // Sync initial anime & scroll to top
  useEffect(() => {
    setAnime(initialAnime);
    setLiveSynopsis(initialAnime?.synopsis || null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Fetch full enriched data (relations, streaming)
    getAnimeById(initialAnime.mal_id)
      .then((fullData) => {
        if (fullData) {
          setAnime((prev) => (prev.mal_id === fullData.mal_id ? { ...prev, ...fullData } : prev));
        }
      })
      .catch((err) => console.warn('[Full Page Details Fetch] Notice:', err));
  }, [initialAnime]);

  // Load all franchise seasons (Season 1, Season 2, Sequels, etc.)
  useEffect(() => {
    if (!anime?.mal_id) return;
    setLoadingSeasons(true);
    getFranchiseSeasons(anime)
      .then((seasons) => setFranchiseSeasons(seasons))
      .catch((err) => console.warn('[Franchise Seasons] Notice:', err))
      .finally(() => setLoadingSeasons(false));
  }, [anime?.mal_id, anime?.title]);

  // Load characters on tab switch
  useEffect(() => {
    if (activeTab === 'characters' && characters.length === 0 && !loadingCharacters && anime?.mal_id) {
      setLoadingCharacters(true);
      getAnimeCharacters(anime.mal_id)
        .then((data) => setCharacters(data || []))
        .catch((err) => console.warn('Failed to load characters:', err))
        .finally(() => setLoadingCharacters(false));
    }
  }, [activeTab, characters.length, loadingCharacters, anime?.mal_id]);

  // Load recommendations on tab switch
  useEffect(() => {
    if (activeTab === 'recommendations' && recommendations.length === 0 && !loadingRecommendations && anime?.mal_id) {
      setLoadingRecommendations(true);
      getAnimeRecommendations(anime.mal_id)
        .then((data) => setRecommendations(data || []))
        .catch((err) => console.warn('Failed to load recommendations:', err))
        .finally(() => setLoadingRecommendations(false));
    }
  }, [activeTab, recommendations.length, loadingRecommendations, anime?.mal_id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/anime/${anime.mal_id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusOptions: { value: ShelfStatus; label: string }[] = [
    { value: 'watching', label: 'Watching' },
    { value: 'plan_to_watch', label: 'Plan to Watch' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'dropped', label: 'Dropped' },
  ];

  // Streaming links & search directories
  const encodedTitle = encodeURIComponent(anime.title || '');
  const searchPlatforms: WatchPlatform[] = [
    {
      name: 'Crunchyroll',
      url: `https://www.crunchyroll.com/search?q=${encodedTitle}`,
      type: 'Subscription',
      region: 'Global',
    },
    {
      name: 'Netflix',
      url: `https://www.netflix.com/search?q=${encodedTitle}`,
      type: 'Subscription',
      region: 'Global',
    },
    {
      name: 'HIDIVE',
      url: `https://www.hidive.com/search?q=${encodedTitle}`,
      type: 'Subscription',
      region: 'North America / Selected',
    },
    {
      name: 'Amazon Prime Video',
      url: `https://www.amazon.com/s?k=${encodedTitle}+anime`,
      type: 'Purchase',
      region: 'Global',
    },
  ];

  const directStreamingLinks = (anime.streaming || []).filter(
    (item) => item.name && item.url && !item.name.toLowerCase().includes('youtube')
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-white transition-colors pb-24">
      {/* Top Breadcrumb & Action Bar */}
      <div className="sticky top-16 z-30 w-full bg-white/95 dark:bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1f2535]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121622] hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-[#222a3a] shrink-0 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalog</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 truncate">
              <span>Catalog</span>
              <span>/</span>
              <span className="font-semibold text-orange-500">{anime.type || 'Anime'}</span>
              <span>/</span>
              <span className="font-medium text-slate-800 dark:text-neutral-200 truncate">{anime.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121622] hover:bg-slate-200 dark:hover:bg-[#181e2e] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-[#222a3a]"
              title="Copy page link"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic Hero Backdrop Banner */}
      <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-black border-b border-slate-200 dark:border-[#1f2535]">
        <img
          src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
          alt=""
          className="w-full h-full object-cover blur-md opacity-25 dark:opacity-20 scale-105 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#000000] via-slate-50/60 dark:via-[#000000]/70 to-transparent" />
      </div>

      {/* Main Full Page Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-44 md:-mt-52 relative z-10 space-y-8">
        {/* Main Header Block: Poster + Titles + Metrics + Direct Actions */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          {/* Large Poster */}
          <div className="shrink-0 w-48 sm:w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#161b26] mx-auto md:mx-0 bg-neutral-900">
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

          {/* Title & Key Metrics */}
          <div className="flex-1 w-full space-y-4">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  {anime.type || 'Anime'}
                </span>
                {anime.status && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                    {anime.status}
                  </span>
                )}
                {anime.season && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize">
                    {anime.season} {anime.year || ''}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                {anime.title}
              </h1>

              {anime.title_english && anime.title_english !== anime.title && (
                <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 font-medium">
                  {anime.title_english}
                </p>
              )}

              {anime.title_japanese && (
                <p className="text-xs text-slate-400 dark:text-neutral-500 font-mono">
                  {anime.title_japanese}
                </p>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
              <div className="p-3 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Score</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {anime.score ? anime.score.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Overall Rank</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {formatOverallRank(anime)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Episodes</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 block">Rating</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mt-0.5 block truncate">
                  {anime.rating || 'Standard'}
                </span>
              </div>
            </div>

            {/* Direct Shelf & User Rating Actions */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {statusOptions.map((opt) => {
                    const isSelected = shelfStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onUpdateStatus(anime, isSelected ? 'plan_to_watch' : opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onToggleLike(anime)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-400 hover:text-rose-500'
                  }`}
                  title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Star Rating Selector (1 to 10) */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Your Score:</span>
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
                        className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-neutral-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                {userRating > 0 && (
                  <span className="text-xs font-bold text-amber-500 ml-1">
                    {userRating}/10
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1f2535] pb-2 text-sm font-semibold overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seasons')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'seasons'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitFork className="w-4 h-4 text-orange-400" />
            <span>All Seasons</span>
            {franchiseSeasons.length > 1 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'seasons' ? 'bg-black/30 text-white' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {franchiseSeasons.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('where_to_watch')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'where_to_watch'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Where to Watch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Characters & Cast</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('relations')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'relations'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Relations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'recommendations'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommendations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manga')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'manga'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Source Manga</span>
          </button>
        </div>

        {/* TAB CONTENT: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Genres & Demographic Badges */}
            {((anime.genres && anime.genres.length > 0) || (anime.themes && anime.themes.length > 0) || (anime.demographics && anime.demographics.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2">
                {anime.demographics?.map((d, i) => (
                  <button
                    key={`demo-${d.name || i}`}
                    type="button"
                    onClick={() => onSelectGenre?.(d.name)}
                    className="px-3 py-1.5 text-xs rounded-xl font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    {d.name}
                  </button>
                ))}
                {anime.genres?.map((g, i) => (
                  <button
                    key={`genre-${g.name || i}`}
                    type="button"
                    onClick={() => onSelectGenre?.(g.name)}
                    className="px-3 py-1.5 text-xs rounded-xl font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-all cursor-pointer"
                  >
                    {g.name}
                  </button>
                ))}
                {anime.themes?.map((t, i) => (
                  <button
                    key={`theme-${t.name || i}`}
                    type="button"
                    onClick={() => onSelectGenre?.(t.name)}
                    className="px-3 py-1.5 text-xs rounded-xl font-medium bg-slate-100 dark:bg-[#121622] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#222a3a] hover:border-orange-500/50 transition-all cursor-pointer"
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Franchise Seasons & Timeline Strip */}
            {franchiseSeasons.length > 1 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-[#1f2535] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-orange-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                      All Franchise Seasons & Sequels ({franchiseSeasons.length} Available)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('seasons')}
                    className="text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    View Timeline Order →
                  </button>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {franchiseSeasons.map((s, idx) => {
                    const isCurrent = s.mal_id === anime.mal_id;
                    return (
                      <button
                        key={`quick-season-${s.mal_id}`}
                        type="button"
                        onClick={async () => {
                          if (isCurrent) return;
                          if (onSelectAnime) {
                            try {
                              const fullSeason = await getAnimeById(s.mal_id);
                              if (fullSeason) onSelectAnime(fullSeason);
                            } catch (e) {
                              console.warn('Failed to switch season:', e);
                            }
                          }
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500/30'
                            : 'bg-slate-50 dark:bg-[#121622] border-slate-200 dark:border-[#222a3a] hover:border-orange-500/50'
                        }`}
                      >
                        <div className="w-7 h-10 rounded-md overflow-hidden bg-neutral-900 shrink-0">
                          <img
                            src={s.images.jpg.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="max-w-[170px] truncate">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="font-bold text-orange-500">Part {idx + 1}</span>
                            {s.year && <span className="text-slate-500 dark:text-neutral-400">{s.year}</span>}
                            {isCurrent && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-white">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate mt-0.5" title={s.title}>
                            {s.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Synopsis */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-[#1f2535] shadow-2xs space-y-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Synopsis
              </h2>
              <p className="text-slate-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {cleanSynopsis(liveSynopsis || anime.synopsis) || 'No synopsis provided for this title.'}
              </p>
            </div>

            {/* Production & Broadcasting Metadata Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-1">
                <span className="text-xs uppercase font-bold text-slate-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Animation Studio</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {anime.studios && anime.studios.length > 0 ? (
                    anime.studios.map((s) => (
                      <button
                        key={s.mal_id || s.name}
                        type="button"
                        onClick={() => onSelectStudio?.(s.name)}
                        className="text-sm font-semibold text-slate-800 dark:text-neutral-200 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        {s.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Not specified</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-1">
                <span className="text-xs uppercase font-bold text-slate-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500" />
                  <span>Broadcast (JST)</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-neutral-200 pt-1">
                  {anime.broadcast?.string || 'Standard Broadcast'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-1">
                <span className="text-xs uppercase font-bold text-slate-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Duration</span>
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-neutral-200 pt-1">
                  {anime.duration || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Official Trailer Video */}
            {anime.trailer?.embed_url && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>Official Trailer</span>
                </h2>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-black">
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

            {/* Native Comment Section */}
            <div className="pt-6">
              <CommentSection mediaId={anime.mal_id} currentUser={currentUser} onOpenAuth={onOpenAuth} />
            </div>
          </div>
        )}

        {/* TAB CONTENT: Where to Watch */}
        {activeTab === 'where_to_watch' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-rose-500" />
                <span>Direct Streaming Links</span>
              </h2>

              {directStreamingLinks.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {directStreamingLinks.map((provider) => (
                    <div key={provider.name} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{provider.name}</span>
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Verified
                        </span>
                      </div>
                      <a
                        href={provider.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <span>Watch Now</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  No direct streaming provider links reported for this title yet.
                </p>
              )}
            </div>

            {/* Search Platform Directories */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform Search Directories
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                {searchPlatforms.map((platform) => (
                  <div key={platform.name} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm block">{platform.name}</span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">{platform.type} • {platform.region}</span>
                    </div>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors"
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

        {/* TAB CONTENT: Characters & Voice Actors */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            {loadingCharacters ? (
              <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
                Loading characters & voice actors...
              </div>
            ) : characters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {characters.map((item, idx) => (
                  <div
                    key={`full-char-${item.character.mal_id}-${idx}`}
                    className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs flex items-center gap-3"
                  >
                    <img
                      src={item.character.images?.jpg?.image_url}
                      alt={item.character.name}
                      className="w-14 h-18 object-cover rounded-xl shrink-0 bg-neutral-900 border border-slate-200 dark:border-neutral-800"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.character.name}
                      </h4>
                      <span className="text-xs text-rose-500 font-semibold block capitalize">
                        {item.role}
                      </span>
                      {item.voice_actors && item.voice_actors.length > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-1">
                          VA: {item.voice_actors[0].person.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
                No character roster reported for this title.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: All Seasons & Franchise Timeline */}
        {activeTab === 'seasons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-[#1f2535] shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-orange-500" />
                  <span>All Seasons & Franchise Timeline</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Chronological release order of all anime seasons, sequels, prequels, movies, and spin-offs in this franchise.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {franchiseSeasons.length} Franchise Works
              </span>
            </div>

            {loadingSeasons ? (
              <div className="py-16 text-center text-slate-500 dark:text-neutral-400">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Loading all seasons in this franchise...</span>
              </div>
            ) : franchiseSeasons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {franchiseSeasons.map((season, idx) => {
                  const isCurrent = season.mal_id === anime.mal_id;
                  return (
                    <div
                      key={`season-card-${season.mal_id}`}
                      className={`group relative p-3.5 rounded-2xl border transition-all flex gap-3.5 ${
                        isCurrent
                          ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                          : 'bg-white dark:bg-[#0a0d14] border-slate-200 dark:border-[#1f2535] hover:border-orange-500/60 hover:shadow-md'
                      }`}
                    >
                      <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-slate-200 dark:border-neutral-800 shadow-2xs">
                        <img
                          src={season.images.jpg.large_image_url || season.images.jpg.image_url}
                          alt={season.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500 text-white">
                              Part {idx + 1}
                            </span>
                            {season.type && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#121622] text-slate-700 dark:text-neutral-300">
                                {season.type}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Current
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors" title={season.title}>
                            {season.title}
                          </h4>

                          {season.title_english && season.title_english !== season.title && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1">
                              {season.title_english}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-[#1a2130] flex items-center justify-between gap-2 mt-2">
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-2">
                            {season.year && <span>{season.year}</span>}
                            {season.score && (
                              <span className="flex items-center gap-0.5 font-bold text-amber-500">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {season.score.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (onSelectAnime) {
                                  try {
                                    const fullTarget = await getAnimeById(season.mal_id);
                                    if (fullTarget) onSelectAnime(fullTarget);
                                  } catch (err) {
                                    console.warn('Failed to switch season:', err);
                                  }
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              View →
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                              Viewing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-[#1f2535] text-center text-slate-500 dark:text-neutral-400 text-sm">
                No additional seasons found for this franchise.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: Relations */}
        {activeTab === 'relations' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-[#1f2535] shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitFork className="w-5 h-5 text-orange-500" />
              <span>Related Works</span>
            </h2>

            {anime.relations && anime.relations.length > 0 ? (
              <div className="space-y-4">
                {anime.relations.map((relation, idx) => (
                  <div key={`rel-${idx}`} className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                      {relation.relation}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {relation.entry?.map((entry) => (
                        <button
                          key={entry.mal_id}
                          type="button"
                          onClick={async () => {
                            if (entry.type === 'anime' && onSelectAnime) {
                              try {
                                const relAnime = await getAnimeById(entry.mal_id);
                                if (relAnime) onSelectAnime(relAnime);
                              } catch (err) {
                                console.warn('Failed to load related anime:', err);
                              }
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                            entry.type === 'anime' && onSelectAnime
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-[#121622] dark:hover:bg-[#181e2e] text-slate-800 dark:text-white border-slate-200 dark:border-[#222a3a] cursor-pointer'
                              : 'bg-slate-50 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800'
                          }`}
                        >
                          <span className="font-semibold block">{entry.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase">{entry.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                No related franchise works listed.
              </p>
            )}
          </div>
        )}

        {/* TAB CONTENT: Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {loadingRecommendations ? (
              <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
                Loading community recommendations...
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recommendations.slice(0, 18).map((rec, idx) => (
                  <div
                    key={`rec-${rec.mal_id}-${idx}`}
                    onClick={async () => {
                      if (onSelectAnime) {
                        try {
                          const target = await getAnimeById(rec.mal_id);
                          if (target) onSelectAnime(target);
                        } catch (err) {
                          console.warn('Failed to load recommendation:', err);
                        }
                      }
                    }}
                    className="group cursor-pointer space-y-2"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xs group-hover:border-rose-500 transition-colors">
                      <img
                        src={rec.image_url}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-neutral-200 line-clamp-2 group-hover:text-rose-500 transition-colors">
                      {rec.title}
                    </h4>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
                No community recommendations recorded yet.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: Source Manga */}
        {activeTab === 'manga' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-neutral-800/80 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              <span>Source Manga & Reading Platforms</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-neutral-300">
              Adapted from source material: <span className="font-semibold text-rose-500">{anime.source || 'Original Work'}</span>
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`https://mangadex.org/search?q=${encodedTitle}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Search MangaDex</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://global.bookwalker.jp/search/?word=${encodedTitle}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <span>BookWalker Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
