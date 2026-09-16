import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimeItem, ShelfStatus, ShelfEntry, UserActivity, PredictionPoll, AuthUser } from './types';
import { 
  getTopAnime, 
  getSeasonalAnime, 
  getUpcomingAnime, 
  searchAnime 
} from './services/jikan';
import {
  getStoredShelf,
  saveShelfEntry,
  removeShelfEntry,
  toggleShelfLike,
  setShelfRating,
  updateShelfProgress,
  getStoredActivities,
  getStoredPolls,
  getUserVotes,
  castPollVote,
} from './services/shelfStorage';
import { getCurrentUser, getAuthHeaders } from './services/authService';
import { fetchServerPolls, voteInPoll } from './services/pollService';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ExploreView } from './components/ExploreView';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { ShelfView, ShelfViewFilterTab } from './components/ShelfView';
import { PollsView } from './components/PollsView';
import { MangaSection } from './components/MangaSection';
import { Footer } from './components/Footer';
import { InfoModal, InfoModalType } from './components/InfoModal';
import { AuthModal } from './components/AuthModal';
import { ProfileView } from './components/ProfileView';
import { AdminSyncPage } from './components/AdminSyncPage';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  Calendar, 
  ArrowRight, 
  Search, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('home');
  const [shelfSubTab, setShelfSubTab] = useState<ShelfViewFilterTab>('all');
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Scroll up on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Data states
  const [spotlightAnime, setSpotlightAnime] = useState<AnimeItem | null>(null);
  const [airingAnime, setAiringAnime] = useState<AnimeItem[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<AnimeItem[]>([]);
  const [topRankedAnime, setTopRankedAnime] = useState<AnimeItem[]>([]);
  const [upcomingAnime, setUpcomingAnime] = useState<AnimeItem[]>([]);
  const [searchResults, setSearchResults] = useState<AnimeItem[]>([]);

  // Rankings filter
  const [rankingFilter, setRankingFilter] = useState<'bypopularity' | 'airing' | 'favorite' | 'upcoming'>('bypopularity');

  // Loading & error states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Shelf & User state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shelf, setShelf] = useState<ShelfEntry[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [polls, setPolls] = useState<PredictionPoll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  // Modal detail view
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);

  // Sync user data from backend database
  const syncUserData = useCallback(async (user: AuthUser | null) => {
    if (!user) return;
    try {
      const [shelfRes, likesRes, ratingsRes] = await Promise.all([
        fetch('/api/shelf', { headers: await getAuthHeaders(), credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/likes', { headers: await getAuthHeaders(), credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/ratings', { headers: await getAuthHeaders(), credentials: 'include' }).then((r) => r.json()).catch(() => null),
      ]);

      const likesMap = new Set<string>();
      if (likesRes?.success && Array.isArray(likesRes.data)) {
        likesRes.data.forEach((l: { media_type: string; media_id: number }) => {
          likesMap.add(`${l.media_type}_${l.media_id}`);
        });
      }

      const ratingsMap = new Map<string, number>();
      if (ratingsRes?.success && Array.isArray(ratingsRes.data)) {
        ratingsRes.data.forEach((r: { media_type: string; media_id: number; rating: number }) => {
          ratingsMap.set(`${r.media_type}_${r.media_id}`, r.rating);
        });
      }

      if (shelfRes?.success && Array.isArray(shelfRes.data)) {
        interface ServerBookmark {
          media_id: number;
          media_type: 'anime' | 'manga';
          title: string;
          image_url?: string;
          status: ShelfStatus;
          progress?: number;
          total_episodes?: number;
          notes?: string;
          updated_at: string;
        }

        const serverShelf: ShelfEntry[] = (shelfRes.data as ServerBookmark[]).map((item) => ({
          id: item.media_id,
          mediaType: item.media_type,
          title: item.title,
          image: item.image_url || '',
          status: item.status,
          progress: item.progress || 0,
          totalUnits: item.total_episodes,
          notes: item.notes,
          userRating: ratingsMap.get(`${item.media_type}_${item.media_id}`),
          isLiked: likesMap.has(`${item.media_type}_${item.media_id}`),
          updatedAt: new Date(item.updated_at).getTime(),
        }));

        // Merge with local shelf to preserve unsynced offline items
        const local = getStoredShelf();
        const merged = [...serverShelf];
        local.forEach((loc) => {
          if (!merged.some((m) => m.id === loc.id && m.mediaType === loc.mediaType)) {
            merged.push(loc);
          }
        });

        setShelf(merged);
      }
    } catch (err) {
      console.warn('[Sync] Server shelf sync notice:', err);
    }
  }, []);

  // Initialize shelf data from local storage & load server auth/polls
  useEffect(() => {
    setShelf(getStoredShelf());
    setActivities(getStoredActivities());
    setPolls(getStoredPolls());
    setUserVotes(getUserVotes());

    // Check user auth session and subscribe to changes
    import('./lib/supabase').then(({ supabase }) => {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.user_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(user);
          syncUserData(user);
        } else {
          setCurrentUser(null);
          setShelf([]);
          setActivities([]);
          setUserVotes({});
        }
      });
    });

    getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        syncUserData(user);
      }
    });

    // Load server prediction polls
    fetchServerPolls().then((serverPolls) => {
      if (serverPolls && serverPolls.length > 0) {
        const mappedPolls: PredictionPoll[] = serverPolls.map((p) => ({
          id: String(p.id),
          question: p.question,
          animeTitle: p.title,
          status: p.status === 'active' ? 'active' : 'closed',
          endsAt: p.ends_at,
          totalVotes: p.total_votes,
          options: p.options.map((opt) => ({
            id: String(opt.id),
            text: opt.option_text,
            votes: opt.votes,
          })),
        }));
        setPolls(mappedPolls);

        const votesMap: Record<string, string> = {};
        serverPolls.forEach((p) => {
          if (p.user_voted_option_id) {
            votesMap[String(p.id)] = String(p.user_voted_option_id);
          }
        });
        if (Object.keys(votesMap).length > 0) {
          setUserVotes((prev) => ({ ...prev, ...votesMap }));
        }
      }
    });
  }, [syncUserData]);

  
  // Fetch initial anime datasets
  const loadInitialData = useCallback(async () => {
    setLoadingInitial(true);
    setApiError(null);

    try {
      // 1. Fetch Top Airing for Spotlight & Airing row
      const airing = await getTopAnime('airing', 12);
      if (airing.length > 0) {
        setAiringAnime(airing);
        setSpotlightAnime(airing[0]);
      }

      // 2. Fetch Seasonal
      const seasonal = await getSeasonalAnime(12);
      if (seasonal.length > 0) {
        setSeasonalAnime(seasonal);
        setSpotlightAnime((prev) => prev || seasonal[0]);
      }

      // 3. Fetch Top Ranked
      const top = await getTopAnime('bypopularity', 12);
      if (top.length > 0) {
        setTopRankedAnime(top);
        setSpotlightAnime((prev) => prev || top[0]);
      }

      // 4. Fetch Upcoming
      const upcoming = await getUpcomingAnime(12);
      if (upcoming.length > 0) {
        setUpcomingAnime(upcoming);
      }

      if (airing.length === 0 && seasonal.length === 0 && top.length === 0) {
        setApiError('The anime network is currently experiencing high load. Some listings may take a moment to appear.');
      }
    } catch (err) {
      console.warn('Initial anime listings load notice:', err);
      setApiError('Unable to connect to the anime database right now. Please retry.');
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load Rankings when rankingFilter changes
  useEffect(() => {
    if (activeTab !== 'rankings') return;
    setLoadingRankings(true);
    getTopAnime(rankingFilter, 24)
      .then((data) => setTopRankedAnime(data))
      .catch((err) => console.warn('[Rankings] Notice:', err))
      .finally(() => setLoadingRankings(false));
  }, [rankingFilter, activeTab]);

  // Search execution with error handling and empty states
  const executeSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setLoadingSearch(false);
      setSearchError(null);
      return;
    }

    setLoadingSearch(true);
    setSearchError(null);

    try {
      const results = await searchAnime(trimmed, 24);
      setSearchResults(results);
    } catch (err) {
      console.warn('Search query error:', err);
      setSearchError('Search is taking longer than expected. Please try again.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  // Debounced search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      executeSearch(debouncedQuery);
    } else {
      setSearchResults([]);
      setSearchError(null);
    }
  }, [debouncedQuery, executeSearch]);

  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    setSearchQuery(trimmed);
    setDebouncedQuery(trimmed);
    if (trimmed) {
      executeSearch(trimmed);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  // Shelf handlers
  const handleAddToShelf = async (anime: AnimeItem, status: ShelfStatus) => {
    const poster =
      anime.images.webp?.large_image_url ||
      anime.images.jpg.large_image_url ||
      anime.images.jpg.image_url;

    const updated = saveShelfEntry({
      id: anime.mal_id,
      mediaType: 'anime',
      title: anime.title,
      image: poster,
      status,
      isLiked: false,
      progress: 0,
      totalUnits: anime.episodes,
    });
    setShelf(updated);
    setActivities(getStoredActivities());

    if (currentUser) {
      fetch('/api/shelf', {
        method: 'POST',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mediaId: anime.mal_id,
          mediaType: 'anime',
          title: anime.title,
          imageUrl: poster,
          status,
          progress: 0,
          totalEpisodes: anime.episodes,
        }),
      }).catch((e) => console.warn('Failed to sync shelf item with server:', e));
    }
  };

  const handleUpdateShelfStatus = (anime: AnimeItem, status: ShelfStatus) => {
    handleAddToShelf(anime, status);
  };

  const handleToggleLike = async (anime: AnimeItem) => {
    const poster =
      anime.images.webp?.large_image_url ||
      anime.images.jpg.large_image_url ||
      anime.images.jpg.image_url;

    const updated = toggleShelfLike(anime.mal_id, 'anime', anime.title, poster);
    setShelf(updated);
    setActivities(getStoredActivities());

    if (currentUser) {
      fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mediaId: anime.mal_id,
          mediaType: 'anime',
          title: anime.title,
          imageUrl: poster,
        }),
      }).catch((e) => console.warn('Failed to toggle like on server:', e));
    }
  };

  const handleUpdateRating = async (anime: AnimeItem, rating: number) => {
    const poster =
      anime.images.webp?.large_image_url ||
      anime.images.jpg.large_image_url ||
      anime.images.jpg.image_url;

    const updated = setShelfRating(anime.mal_id, 'anime', rating, anime.title, poster);
    setShelf(updated);
    setActivities(getStoredActivities());

    if (currentUser) {
      fetch('/api/ratings', {
        method: 'POST',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mediaId: anime.mal_id,
          mediaType: 'anime',
          rating,
          title: anime.title,
          imageUrl: poster,
        }),
      }).catch((e) => console.warn('Failed to update rating on server:', e));
    }
  };

  const handleUpdateProgress = async (id: number, mediaType: "anime" | "manga", progress: number) => {
    const updated = updateShelfProgress(id, mediaType, progress);
    setShelf(updated);

    if (currentUser) {
      const item = updated.find((i) => i.id === id && i.mediaType === mediaType);
      if (item) {
        fetch('/api/shelf', {
          method: 'POST',
          headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mediaId: id,
            mediaType,
            title: item.title,
            imageUrl: item.image,
            status: item.status,
            progress,
            totalEpisodes: item.totalUnits,
          }),
        }).catch((e) => console.warn('Failed to update progress on server:', e));
      }
    }
  };

  const handleRemoveFromShelf = async (id: number, mediaType: "anime" | "manga") => {
    const updated = removeShelfEntry(id, mediaType);
    setShelf(updated);
    setActivities(getStoredActivities());

    if (currentUser) {
      fetch(`/api/shelf/${mediaType}/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
        credentials: 'include',
      }).catch((e) => console.warn('Failed to delete shelf item on server:', e));
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    const numPollId = Number(pollId);
    const numOptId = Number(optionId);

    // Call server API for live database voting
    if (!isNaN(numPollId) && !isNaN(numOptId)) {
      try {
        const res = await voteInPoll(numPollId, numOptId);
        if (res.success && res.data) {
          const updated = res.data;
          setPolls((prev) =>
            prev.map((p) =>
              p.id === pollId
                ? {
                    ...p,
                    totalVotes: updated.total_votes,
                    options: updated.options.map((o) => ({
                      id: String(o.id),
                      text: o.option_text,
                      votes: o.votes,
                    })),
                  }
                : p
            )
          );
          setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
          return;
        }
      } catch (err) {
        console.warn('Server vote submission note:', err);
      }
    }

    // Fallback to local vote tallying if server is unavailable
    const { polls: updatedPolls, votes: updatedVotes } = castPollVote(pollId, optionId);
    setPolls(updatedPolls);
    setUserVotes(updatedVotes);
  };

  // Helper to check if anime is in shelf
  const getShelfItem = (animeId: number) => {
    return shelf.find((item) => item.id === animeId && item.mediaType === 'anime');
  };

  const isSearchActive = debouncedQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={isSearchActive ? '' : activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          handleClearSearch();
        }}
        shelfCount={shelf.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full space-y-10"
          >
        {/* Error banner if API is down */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/80 flex items-center justify-between gap-4 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={loadInitialData}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-white font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 1. SEARCH RESULTS VIEW */}
        {isSearchActive ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5 text-white">
                <Search className="w-5 h-5 text-rose-500" />
                <div>
                  <h2 className="text-xl font-bold font-display">
                    Search Results for &ldquo;{debouncedQuery || searchQuery}&rdquo;
                  </h2>
                  {!loadingSearch && !searchError && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {searchResults.length} {searchResults.length === 1 ? 'title found' : 'titles found'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1 rounded-md hover:bg-neutral-900 border border-neutral-800 transition-colors"
              >
                Clear Search
              </button>
            </div>

            {loadingSearch ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400 animate-pulse">Searching anime titles...</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-xl bg-neutral-900 animate-pulse border border-neutral-800"
                    />
                  ))}
                </div>
              </div>
            ) : searchError ? (
              <div className="p-12 text-center rounded-xl bg-neutral-900/40 border border-neutral-800/80 space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto opacity-80" />
                <p className="text-neutral-300 text-sm font-medium">{searchError}</p>
                <button
                  onClick={() => executeSearch(debouncedQuery || searchQuery)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-16 text-center rounded-xl bg-neutral-900/30 border border-neutral-800/60 space-y-2">
                <p className="text-neutral-300 text-sm font-medium">
                  No titles matching &ldquo;{debouncedQuery || searchQuery}&rdquo; were found.
                </p>
                <p className="text-neutral-400 text-xs max-w-md mx-auto">
                  Try searching with the Japanese romaji title (e.g. Shingeki no Kyojin, Kimetsu no Yaiba) or checking for spelling errors.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.map((anime, idx) => {
                  const shelfItem = getShelfItem(anime.mal_id);
                  return (
                    <AnimeCard
                      key={`search-${anime.mal_id}-${idx}`}
                      anime={anime}
                      onSelect={setSelectedAnime}
                      isLiked={shelfItem?.isLiked}
                      onToggleLike={handleToggleLike}
                      shelfStatus={shelfItem?.status}
                      onUpdateShelfStatus={handleUpdateShelfStatus}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* TAB: EXPLORE */}
            {activeTab === 'explore' && (
              <ExploreView 
                onSelectAnime={setSelectedAnime}
                getShelfStatus={(id) => getShelfItem(id)?.status}
                onUpdateStatus={handleUpdateShelfStatus}
                onToggleLike={handleToggleLike}
                getIsLiked={(id) => getShelfItem(id)?.isLiked || false}
              />
            )}
            {/* 2. TAB: HOME (DISCOVER) */}
            {activeTab === 'admin' && <AdminSyncPage />}
        {activeTab === 'home' && (
              loadingInitial ? (
                <div className="space-y-8 animate-pulse">
                  <div className="w-full h-80 sm:h-96 rounded-2xl bg-neutral-900 border border-neutral-800" />
                  <div className="space-y-4">
                    <div className="h-6 w-48 bg-neutral-900 rounded" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-900 border border-neutral-800" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Hero Spotlight */}
                  <HeroBanner
                    anime={spotlightAnime}
                    onSelect={setSelectedAnime}
                    onAddToShelf={handleAddToShelf}
                    isSavedInShelf={Boolean(spotlightAnime && getShelfItem(spotlightAnime.mal_id))}
                  />

                  {/* Currently Airing Row */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight">
                          Trending Airing Anime
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('rankings');
                          setRankingFilter('airing');
                        }}
                        className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {airingAnime.slice(0, 6).map((anime, idx) => {
                        const shelfItem = getShelfItem(anime.mal_id);
                        return (
                          <AnimeCard
                            key={`airing-${anime.mal_id}-${idx}`}
                            anime={anime}
                            onSelect={setSelectedAnime}
                            isLiked={shelfItem?.isLiked}
                            onToggleLike={handleToggleLike}
                            shelfStatus={shelfItem?.status}
                            onUpdateShelfStatus={handleUpdateShelfStatus}
                          />
                        );
                      })}
                    </div>
                  </section>

                  {/* Seasonal Highlights Row */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight">
                          This Season&apos;s Highlights
                        </h2>
                      </div>
                      <button
                        onClick={() => setActiveTab('seasonal')}
                        className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                      >
                        <span>Explore Season</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {seasonalAnime.slice(0, 6).map((anime, idx) => {
                        const shelfItem = getShelfItem(anime.mal_id);
                        return (
                          <AnimeCard
                            key={`seasonal-highlight-${anime.mal_id}-${idx}`}
                            anime={anime}
                            onSelect={setSelectedAnime}
                            isLiked={shelfItem?.isLiked}
                            onToggleLike={handleToggleLike}
                            shelfStatus={shelfItem?.status}
                            onUpdateShelfStatus={handleUpdateShelfStatus}
                          />
                        );
                      })}
                    </div>
                  </section>

                  {/* Upcoming Anticipated Releases Row */}
                  {upcomingAnime.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-400" />
                          <h2 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight">
                            Anticipated Upcoming Releases
                          </h2>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('rankings');
                            setRankingFilter('upcoming');
                          }}
                          className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                        >
                          <span>View All Upcoming</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {upcomingAnime.slice(0, 6).map((anime, idx) => {
                          const shelfItem = getShelfItem(anime.mal_id);
                          return (
                            <AnimeCard
                              key={`upcoming-${anime.mal_id}-${idx}`}
                              anime={anime}
                              onSelect={setSelectedAnime}
                              isLiked={shelfItem?.isLiked}
                              onToggleLike={handleToggleLike}
                              shelfStatus={shelfItem?.status}
                              onUpdateShelfStatus={handleUpdateShelfStatus}
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Prediction Polls Teaser */}
                  <section className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Community Feature
                      </span>
                      <h3 className="text-xl font-extrabold text-white font-display">
                        Have Your Say in Seasonal Prediction Polls
                      </h3>
                      <p className="text-xs text-neutral-400 max-w-xl">
                        Vote on anime of the year candidates, upcoming movie adaptations, and battle outcomes.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('polls')}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-2"
                    >
                      <span>Go to Predictions</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>

                  {/* All-Time Popular Classics */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight">
                          Most Popular Titles of All Time
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('rankings');
                          setRankingFilter('bypopularity');
                        }}
                        className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                      >
                        <span>Full Rankings</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {topRankedAnime.slice(0, 6).map((anime, idx) => {
                        const shelfItem = getShelfItem(anime.mal_id);
                        return (
                          <AnimeCard
                            key={`top-rank-${anime.mal_id}-${idx}`}
                            anime={anime}
                            onSelect={setSelectedAnime}
                            isLiked={shelfItem?.isLiked}
                            onToggleLike={handleToggleLike}
                            shelfStatus={shelfItem?.status}
                            onUpdateShelfStatus={handleUpdateShelfStatus}
                          />
                        );
                      })}
                    </div>
                  </section>
                </div>
              )
            )}

            {/* 3. TAB: THIS SEASON */}
            {activeTab === 'seasonal' && (
              <div className="space-y-8">
                <div className="border-b border-neutral-800 pb-6">
                  <div className="flex items-center gap-2 text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Current Broadcast Schedule</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    Seasonal Anime Directory
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    Currently premiering series, sequels, and simulcasts airing this season.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {seasonalAnime.map((anime, idx) => {
                    const shelfItem = getShelfItem(anime.mal_id);
                    return (
                      <AnimeCard
                        key={`season-page-${anime.mal_id}-${idx}`}
                        anime={anime}
                        onSelect={setSelectedAnime}
                        isLiked={shelfItem?.isLiked}
                        onToggleLike={handleToggleLike}
                        shelfStatus={shelfItem?.status}
                        onUpdateShelfStatus={handleUpdateShelfStatus}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. TAB: RANKINGS */}
            {activeTab === 'rankings' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 text-xs uppercase font-bold tracking-wider mb-1">
                      <Trophy className="w-4 h-4" />
                      <span>Official Scores & Statistics</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                      Top Anime Rankings
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                      Global rankings calculated from verified community scores and viewership.
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start">
                    {[
                      { id: 'bypopularity', label: 'Popularity' },
                      { id: 'airing', label: 'Top Airing' },
                      { id: 'favorite', label: 'Favorites' },
                      { id: 'upcoming', label: 'Anticipated' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setRankingFilter(f.id as typeof rankingFilter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          rankingFilter === f.id
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingRankings ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-[3/4] rounded-xl bg-neutral-900 animate-pulse border border-neutral-800"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {topRankedAnime.map((anime, idx) => {
                      const shelfItem = getShelfItem(anime.mal_id);
                      return (
                        <AnimeCard
                          key={`rank-page-${anime.mal_id}-${idx}`}
                          anime={anime}
                          onSelect={setSelectedAnime}
                          isLiked={shelfItem?.isLiked}
                          onToggleLike={handleToggleLike}
                          shelfStatus={shelfItem?.status}
                          onUpdateShelfStatus={handleUpdateShelfStatus}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. TAB: MANGA */}
            {activeTab === 'manga' && <MangaSection />}

            {/* 6. TAB: POLLS */}
            {activeTab === 'polls' && (
              <PollsView
                polls={polls}
                userVotes={userVotes}
                onVote={handleVotePoll}
              />
            )}

            {/* 7. TAB: MY SHELF */}
            {activeTab === 'profile' && currentUser && (
              <ProfileView currentUser={currentUser} onProfileUpdated={setCurrentUser} />
            )}
            {activeTab === 'shelf' && (
              <ShelfView
                shelf={shelf}
                activities={activities}
                activeSubTab={shelfSubTab}
                onTabChange={(tab) => setShelfSubTab(tab)}
                onSelectMedia={(id) => {
                  const item = shelf.find((s) => s.id === id);
                  if (item) {
                    // Fetch full anime if needed or open modal
                    setSelectedAnime({
                      mal_id: item.id,
                      url: '',
                      images: {
                        jpg: { image_url: item.image },
                      },
                      title: item.title,
                      airing: false,
                    });
                  }
                }}
                onUpdateStatus={(id, mediaType, status) => {
                  const target = shelf.find((s) => s.id === id && s.mediaType === mediaType);
                  if (target) {
                    saveShelfEntry({
                      ...target,
                      status,
                    });
                    setShelf(getStoredShelf());
                    setActivities(getStoredActivities());
                  }
                }}
                onUpdateRating={(id, mediaType, rating) => {
                  const target = shelf.find((s) => s.id === id && s.mediaType === mediaType);
                  if (target) {
                    const updated = setShelfRating(id, mediaType, rating, target.title, target.image);
                    setShelf(updated);
                    setActivities(getStoredActivities());
                  }
                }}
                onUpdateProgress={handleUpdateProgress}
                onRemove={handleRemoveFromShelf}
                onToggleLike={(id, mediaType, title, image) => {
                  const updated = toggleShelfLike(id, mediaType, title, image);
                  setShelf(updated);
                  setActivities(getStoredActivities());
                }}
              />
            )}
          </>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          currentUser={currentUser}
          onOpenAuth={() => setAuthModalOpen(true)}
          onClose={() => setSelectedAnime(null)}
          shelfStatus={getShelfItem(selectedAnime.mal_id)?.status}
          userRating={getShelfItem(selectedAnime.mal_id)?.userRating}
          isLiked={getShelfItem(selectedAnime.mal_id)?.isLiked}
          onUpdateStatus={handleUpdateShelfStatus}
          onUpdateRating={handleUpdateRating}
          onToggleLike={handleToggleLike}
        />
      )}
      </AnimatePresence>

      {/* Footer */}
      <Footer
        onNavigateTab={(tab, subTab) => {
          setActiveTab(tab);
          if (subTab) {
            setShelfSubTab(subTab as ShelfViewFilterTab);
          }
          handleClearSearch();
        }}
        onOpenInfoModal={(type) => setInfoModalType(type)}
      />

      {/* Legal & Info Modal */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      {/* User Account / Sign In Modal */}
      {authModalOpen && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            if (user) {
              syncUserData(user);
            }
          }}
        />
      )}
    </div>
  );
}
