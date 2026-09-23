import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { AnimeItem, ShelfStatus, ShelfEntry, UserActivity, PredictionPoll, AuthUser, DailyStreakInfo, ThemeMode } from './types';
import { 
  getTopAnime,
  getTopAnimePaginated,
  getSeasonalAnime, 
  getUpcomingAnime, 
  searchAnime,
  searchAnimePaginated,
  getAnimeById
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
  createStoredPoll,
} from './services/shelfStorage';
import { getCurrentUser, getAuthHeaders, getSavedAccounts } from './services/authService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { fetchServerPolls, voteInPoll } from './services/pollService';
import { getStreakInfo, recordDailyCheckIn } from './services/streakService';
import { getMembership, recordPollCreation, isUserDonor } from './services/membershipService';
import { 
  getStoredThemeMode, 
  setStoredThemeMode, 
  applyTheme, 
  applyViewScale,
  setupSystemThemeListener 
} from './services/themeService';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ExploreView } from './components/ExploreView';
import { AdvancedSearchView } from './components/AdvancedSearchView';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { ShelfView, ShelfViewFilterTab } from './components/ShelfView';
import { PollsView } from './components/PollsView';
import { MangaSection } from './components/MangaSection';
import { ScheduleView } from './components/ScheduleView';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { VoiceActorModal } from './components/VoiceActorModal';
import { ShelfStatsModal } from './components/ShelfStatsModal';
import { ShelfImportExportModal } from './components/ShelfImportExportModal';
import { Footer } from './components/Footer';
import { InfoModal, InfoModalType } from './components/InfoModal';
import { AuthModal } from './components/AuthModal';
import { ProfileView } from './components/ProfileView';
import { AdminSyncPage } from './components/AdminSyncPage';
import { DailyStreakModal } from './components/DailyStreakModal';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { AppearanceModal } from './components/AppearanceModal';
import { CreatePollModal } from './components/CreatePollModal';
import { MembershipSupportModal } from './components/MembershipSupportModal';
import { DonationTickerMarquee } from './components/DonationTickerMarquee';
import { NoticeTickerMarquee } from './components/NoticeTickerMarquee';
import { AnnouncementsModal } from './components/AnnouncementsModal';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  Calendar, 
  ArrowRight, 
  Search, 
  RefreshCw,
  AlertCircle, Star,
  List,
  LayoutGrid,
  Compass,
  X,
  ChevronRight
} from 'lucide-react';

const DISCOVER_GENRE_PILLS = [
  { name: 'Sports', value: '30' },
  { name: 'Action', value: '1' },
  { name: 'Romance', value: '22' },
  { name: 'Comedy', value: '4' },
  { name: 'Fantasy', value: '10' },
  { name: 'Sci-Fi', value: '24' },
  { name: 'Isekai', value: '62' },
  { name: 'Shounen', value: '27' },
  { name: 'Seinen', value: '42' },
  { name: 'Mystery', value: '7' },
  { name: 'Supernatural', value: '37' },
  { name: 'Slice of Life', value: '36' },
  { name: 'Mecha', value: '18' },
  { name: 'Psychological', value: '40' },
  { name: 'Suspense', value: '41' },
  { name: 'Drama', value: '8' },
];

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('home');
  const [shelfSubTab, setShelfSubTab] = useState<ShelfViewFilterTab>('all');
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchPage, setSearchPage] = useState(1);
const [searchHasMore, setSearchHasMore] = useState(false);
const [loadingMoreSearch, setLoadingMoreSearch] = useState(false);

  // Fast GPU-friendly instant scroll on tab change to prevent mobile stutter
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Discover page genre filtering state
  const [discoverGenre, setDiscoverGenre] = useState<string | null>(null);
  const [discoverGenreResults, setDiscoverGenreResults] = useState<AnimeItem[]>([]);
  const [loadingDiscoverGenre, setLoadingDiscoverGenre] = useState(false);
  const [discoverGenrePage, setDiscoverGenrePage] = useState(1);
  const [discoverGenreHasMore, setDiscoverGenreHasMore] = useState(true);
  const [exploreGenre, setExploreGenre] = useState<number | string | null>(null);

  // Data states
  const [spotlightAnime, setSpotlightAnime] = useState<AnimeItem | null>(null);
  const [airingAnime, setAiringAnime] = useState<AnimeItem[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<AnimeItem[]>([]);
  const [topRankedAnime, setTopRankedAnime] = useState<AnimeItem[]>([]);
  const [upcomingAnime, setUpcomingAnime] = useState<AnimeItem[]>([]);
  const [searchResults, setSearchResults] = useState<AnimeItem[]>([]);

  // Rankings filter
  const [rankingFilter, setRankingFilter] = useState<'bypopularity' | 'airing' | 'favorite' | 'upcoming' | 'top100'>('bypopularity');
  const [rankingGenre, setRankingGenre] = useState<string>('all');
  const [rankingYear, setRankingYear] = useState<string>('all');
  const [rankingViewMode, setRankingViewMode] = useState<'list' | 'grid'>('list');

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

  // Daily Otaku Streak state
  const [streakInfo, setStreakInfo] = useState<DailyStreakInfo>(() => getStreakInfo(currentUser?.id));
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  // Multi-Account Switcher state
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [savedAccountsCount, setSavedAccountsCount] = useState<number>(() => getSavedAccounts().length);

  // Screen Appearance & Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false);

  // Membership & VIP state
  const [isPremium, setIsPremium] = useState<boolean>(() => getMembership(currentUser?.id).isPremium);
  const [createPollModalOpen, setCreatePollModalOpen] = useState(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [membershipModalInitialTab, setMembershipModalInitialTab] = useState<'membership' | 'donate'>('membership');

  // Supporter / Donor State (tracked in localStorage and event-synced)
  const [isDonor, setIsDonor] = useState<boolean>(() => isUserDonor(currentUser?.id));

  // Announcements & Notices State
  const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);

  // Sync premium & donor status on user change
  useEffect(() => {
    setIsPremium(getMembership(currentUser?.id).isPremium);
    setIsDonor(isUserDonor(currentUser?.id));
  }, [currentUser]);

  // Sync donor status on real-time events
  useEffect(() => {
    const handleDonorUpdate = () => {
      setIsDonor(isUserDonor(currentUser?.id));
    };
    window.addEventListener('kuroshelf_donor_status_changed', handleDonorUpdate);
    window.addEventListener('kuroshelf_donation_made', handleDonorUpdate);
    return () => {
      window.removeEventListener('kuroshelf_donor_status_changed', handleDonorUpdate);
      window.removeEventListener('kuroshelf_donation_made', handleDonorUpdate);
    };
  }, [currentUser]);

  // Sync membership status on real-time events
  useEffect(() => {
    const handleMembershipUpdate = () => {
      setIsPremium(getMembership(currentUser?.id).isPremium);
    };
    window.addEventListener('kuroshelf_membership_updated', handleMembershipUpdate);
    return () => {
      window.removeEventListener('kuroshelf_membership_updated', handleMembershipUpdate);
    };
  }, [currentUser]);

  // Apply theme on mount and whenever themeMode changes
  useEffect(() => {
    applyTheme(themeMode);
    if (themeMode === 'system') {
      const cleanup = setupSystemThemeListener(() => {
        applyTheme('system');
      });
      return cleanup;
    }
  }, [themeMode]);

  // Permanently lock backend application scale (80-85% comfortable view) on mount
  useEffect(() => {
    applyViewScale();
  }, []);

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    setStoredThemeMode(mode);
  };

  const handleToggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const nextMode: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
    handleThemeModeChange(nextMode);
  };

  // Card grid layout: crisp, spacious, beautifully responsive columns with locked 82% view scale
  const cardGridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6';

  // Modal detail view
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);

  // Sub-modals for Characters & Voice Actors explorer
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: number; name: string } | null>(null);
  const [selectedVoiceActor, setSelectedVoiceActor] = useState<{ id: number; name: string } | null>(null);

  // Shelf sub-modals for Stats & Import/Export
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);

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
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const rawUsername = session.user.user_metadata?.user_name || session.user.email?.split('@')[0] || 'User';
          const isAdmin = rawUsername.toLowerCase() === 'kuro' || session.user.user_metadata?.role === 'admin';
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            username: rawUsername,
            display_name: session.user.user_metadata?.full_name || rawUsername,
            profile_setup_complete: !!session.user.user_metadata?.user_name,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            role: isAdmin ? 'admin' : 'user',
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(user);
          localStorage.setItem('kuro_local_user', JSON.stringify(user));
          syncUserData(user);
        } else {
          // If no active Supabase session, only reset if there's no active local/preset user
          const localUser = localStorage.getItem('kuro_local_user');
          if (!localUser) {
            setCurrentUser(null);
            setShelf([]);
            setActivities([]);
            setUserVotes({});
          }
        }
      });

      getCurrentUser().then((user) => {
        setCurrentUser(user);
        if (user) {
          syncUserData(user);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } else {
      getCurrentUser().then((user) => {
        setCurrentUser(user);
        if (user) {
          syncUserData(user);
        }
      });
    }

    // Load server prediction polls
    fetchServerPolls().then((serverPolls) => {
      if (serverPolls && serverPolls.length > 0) {
        const mappedPolls: PredictionPoll[] = serverPolls.map((p) => ({
          id: String(p.id),
          question: p.question,
          animeTitle: p.title,
          animeId: p.anime_id ?? undefined,
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

  // Auto Check-In Daily Streak upon entering or performing any activity
  const triggerAutoStreakCheckIn = useCallback((userId?: string) => {
    const effectiveUserId = userId || currentUser?.id;
    const current = getStreakInfo(effectiveUserId);
    if (!current.checkedInToday) {
      const res = recordDailyCheckIn(effectiveUserId);
      setStreakInfo(res.info);
      return res;
    }
    return null;
  }, [currentUser?.id]);

  // Synchronize scoped storage and streaks when active user changes (and auto-secure daily streak)
  useEffect(() => {
    if (currentUser) {
      setShelf(getStoredShelf(currentUser.id));
      setActivities(getStoredActivities(currentUser.id));
      const autoRes = triggerAutoStreakCheckIn(currentUser.id);
      if (!autoRes) {
        setStreakInfo(getStreakInfo(currentUser.id));
      }
      setSavedAccountsCount(getSavedAccounts().length);
    } else {
      const autoRes = triggerAutoStreakCheckIn(undefined);
      if (!autoRes) {
        setStreakInfo(getStreakInfo(undefined));
      }
    }
  }, [currentUser, triggerAutoStreakCheckIn]);

  const handleAccountSwitched = useCallback((newUser: AuthUser) => {
    setCurrentUser(newUser);
    setShelf(getStoredShelf(newUser.id));
    setActivities(getStoredActivities(newUser.id));
    const autoRes = triggerAutoStreakCheckIn(newUser.id);
    if (!autoRes) {
      setStreakInfo(getStreakInfo(newUser.id));
    }
    setSavedAccountsCount(getSavedAccounts().length);
    syncUserData(newUser);
  }, [syncUserData, triggerAutoStreakCheckIn]);
  
  // Fetch initial anime datasets
  const loadInitialData = useCallback(async () => {
    setLoadingInitial(true);
    setApiError(null);

    try {
      // Fetch in parallel using Promise.allSettled so if any single endpoint is slow or throttled,
      // all other sections (airing, seasonal, top, upcoming) still render smoothly!
      const [airingRes, seasonalRes, topRes, upcomingRes] = await Promise.allSettled([
        getTopAnime('airing', 24),
        getSeasonalAnime(24),
        getTopAnimePaginated('bypopularity', 1, 24).then((res) => res.data),
        getUpcomingAnime(24),
      ]);

      const airing = airingRes.status === 'fulfilled' ? airingRes.value : [];
      const seasonal = seasonalRes.status === 'fulfilled' ? seasonalRes.value : [];
      const top = topRes.status === 'fulfilled' ? topRes.value : [];
      const upcoming = upcomingRes.status === 'fulfilled' ? upcomingRes.value : [];

      if (airing.length > 0) {
        setAiringAnime(airing);
        setSpotlightAnime((prev) => prev || airing[0]);
      }

      if (seasonal.length > 0) {
        setSeasonalAnime(seasonal);
        setSpotlightAnime((prev) => prev || seasonal[0]);
      }

      if (top.length > 0) {
        setTopRankedAnime(top);
        setSpotlightAnime((prev) => prev || top[0]);
      }

      if (upcoming.length > 0) {
        setUpcomingAnime(upcoming);
      }

      if (airing.length === 0 && seasonal.length === 0 && top.length === 0) {
        setApiError('The anime network is currently experiencing high load. Some listings may take a moment to appear.');
      }
    } catch (err) {
      console.warn('Initial anime listings load notice:', err);
      setApiError('Unable to load anime catalog right now. Please retry.');
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
    getTopAnime(rankingFilter, 100, 1, rankingGenre, rankingYear)
      .then((data) => setTopRankedAnime(data))
      .catch((err) => console.warn('[Rankings] Notice:', err))
      .finally(() => setLoadingRankings(false));
  }, [rankingFilter, activeTab, rankingGenre, rankingYear]);

  // Discover page genre filtering logic
  const handleSelectDiscoverGenre = useCallback(async (genreVal: string | null, pageNum: number = 1) => {
    let targetVal = genreVal;
    if (genreVal) {
      const match = DISCOVER_GENRE_PILLS.find(
        (p) => p.value === genreVal || p.name.toLowerCase() === genreVal.toLowerCase()
      );
      if (match) {
        targetVal = match.value;
      }
    }

    setDiscoverGenre(targetVal);
    setActiveTab('home');

    if (!targetVal) {
      setDiscoverGenreResults([]);
      setDiscoverGenrePage(1);
      setDiscoverGenreHasMore(true);
      return;
    }
    setLoadingDiscoverGenre(true);
    try {
      const params = new URLSearchParams({
        genres: targetVal,
        limit: '24',
        page: String(pageNum),
      });
      const res = await fetch(`/api/anime/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        if (pageNum === 1) {
          setDiscoverGenreResults(data);
          setTimeout(() => {
            const el = document.getElementById('discover-genre-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        } else {
          setDiscoverGenreResults((prev) => [...prev, ...data]);
        }
        setDiscoverGenreHasMore(data.length >= 24);
        setDiscoverGenrePage(pageNum);
      }
    } catch (err) {
      console.warn('Discover genre fetch error:', err);
    } finally {
      setLoadingDiscoverGenre(false);
    }
  }, []);

  const loadMoreDiscoverGenre = () => {
    if (!discoverGenre || loadingDiscoverGenre) return;
    handleSelectDiscoverGenre(discoverGenre, discoverGenrePage + 1);
  };

  const handleOpenGenreInExplore = (genre: string | number) => {
    setExploreGenre(genre);
    setActiveTab('explore');
    window.scrollTo(0, 0);
  };

  // Interconnected navigation states & helpers
  const [mangaSearchQuery, setMangaSearchQuery] = useState('');

  const handleNavigateToManga = (mangaTitle: string) => {
    setMangaSearchQuery(mangaTitle);
    setActiveTab('manga');
    window.scrollTo(0, 0);
  };

  const handleSelectStudio = (studioName: string) => {
    setSearchQuery(studioName);
    setDebouncedQuery(studioName);
    setActiveTab('discover');
    window.scrollTo(0, 0);
  };

  const handleSelectYearSeason = (year: number) => {
    setRankingYear(String(year));
    setActiveTab('rankings');
    window.scrollTo(0, 0);
  };

  const handleSelectPollAnime = async (animeId?: number, animeTitle?: string) => {
    if (animeId) {
      try {
        const anime = await getAnimeById(animeId);
        if (anime) {
          setSelectedAnime(anime);
          return;
        }
      } catch {
        // fallback to search
      }
    }
    if (animeTitle) {
      try {
        const results = await searchAnime(animeTitle, 1);
        if (results && results.length > 0) {
          setSelectedAnime(results[0]);
          return;
        }
      } catch {
        // fallback
      }
    }
  };

  // Search execution with error handling and empty states
  const executeSearch = useCallback(async (query: string) => {
  const trimmed = query.trim();

  if (!trimmed) {
    setSearchResults([]);
    setSearchPage(1);
    setSearchHasMore(false);
    setLoadingSearch(false);
    setSearchError(null);
    return;
  }

  setLoadingSearch(true);
  setSearchError(null);

  try {
    const result = await searchAnimePaginated({
      query: trimmed,
      page: 1,
      limit: 24,
    });

    setSearchResults(result.data || []);
    setSearchPage(1);

    setSearchHasMore(
      Boolean(
        result.pagination?.has_next_page ||
        (result.data?.length ?? 0) === 24
      )
    );
  } catch (err) {
    console.warn('Search query error:', err);
    setSearchError(
      'Search is taking longer than expected. Please try again.'
    );
    setSearchResults([]);
    setSearchHasMore(false);
  } finally {
    setLoadingSearch(false);
  }
}, []);
  const loadMoreSearchResults = useCallback(async () => {
  if (loadingMoreSearch || !searchHasMore || !searchQuery.trim()) {
    return;
  }

  setLoadingMoreSearch(true);

  try {
    const nextPage = searchPage + 1;

    const result = await searchAnimePaginated({
      query: searchQuery.trim(),
      page: nextPage,
      limit: 24,
    });

    const newResults = result.data || [];

    setSearchResults((previous) => {
      const existingIds = new Set(
        previous.map((anime) => anime.mal_id)
      );

      const uniqueNewResults = newResults.filter(
        (anime) => !existingIds.has(anime.mal_id)
      );

      return [...previous, ...uniqueNewResults];
    });

    setSearchPage(nextPage);

    setSearchHasMore(
      Boolean(
        result.pagination?.has_next_page ||
        newResults.length === 24
      )
    );
  } catch (err) {
    console.warn('Load more search results failed:', err);
  } finally {
    setLoadingMoreSearch(false);
  }
}, [
  loadingMoreSearch,
  searchHasMore,
  searchQuery,
  searchPage
]);
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
    triggerAutoStreakCheckIn(currentUser?.id);
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
    triggerAutoStreakCheckIn(currentUser?.id);
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
    triggerAutoStreakCheckIn(currentUser?.id);
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
    triggerAutoStreakCheckIn(currentUser?.id);
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

  const handleImportShelf = (newItems: ShelfEntry[], mode: 'merge' | 'replace') => {
    let updatedShelf: ShelfEntry[] = [];
    if (mode === 'replace') {
      updatedShelf = newItems;
    } else {
      const existingMap = new Map<string, ShelfEntry>();
      shelf.forEach((item) => {
        existingMap.set(`${item.mediaType || 'anime'}_${item.id}`, item);
      });
      newItems.forEach((item) => {
        existingMap.set(`${item.mediaType || 'anime'}_${item.id}`, item);
      });
      updatedShelf = Array.from(existingMap.values());
    }
    try {
      localStorage.setItem('kuro_shelf_items', JSON.stringify(updatedShelf));
    } catch (e) {
      console.warn('Failed to save imported shelf to localStorage:', e);
    }
    setShelf(updatedShelf);
    setActivities(getStoredActivities());
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    triggerAutoStreakCheckIn(currentUser?.id);
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

  const handleCreatePoll = (pollData: {
    animeTitle?: string;
    question: string;
    options: string[];
    durationDays: number;
  }) => {
    triggerAutoStreakCheckIn(currentUser?.id);
    const endsAt = new Date(Date.now() + pollData.durationDays * 24 * 60 * 60 * 1000).toISOString();
    const created = createStoredPoll({
      animeTitle: pollData.animeTitle,
      question: pollData.question,
      options: pollData.options.map((text, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text,
        votes: 0,
      })),
      endsAt,
      creatorId: currentUser?.id,
      creatorName: currentUser?.display_name || currentUser?.username || 'Otaku Member',
      isVipPoll: isPremium,
    });

    setPolls(created);
    if (created.length > 0) {
      recordPollCreation(created[0].id, currentUser?.id);
    }
  };

  // High-performance O(1) hash map for shelf lookups
  const shelfMap = useMemo(() => {
    const map = new Map<string, ShelfEntry>();
    for (const item of shelf) {
      map.set(`${item.mediaType || 'anime'}_${item.id}`, item);
    }
    return map;
  }, [shelf]);

  // Helper to check if anime is in shelf
  const getShelfItem = useCallback((animeId: number, mediaType: 'anime' | 'manga' = 'anime') => {
    return shelfMap.get(`${mediaType}_${animeId}`);
  }, [shelfMap]);

  const isSearchActive = debouncedQuery.trim().length > 0;

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-main)] flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-400 transition-colors duration-200">
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
        streakInfo={streakInfo}
        onOpenStreakModal={() => setStreakModalOpen(true)}
        onOpenAccountSwitcher={() => setAccountSwitcherOpen(true)}
        savedAccountsCount={savedAccountsCount}
        themeMode={themeMode}
        onOpenAppearanceModal={() => setAppearanceModalOpen(true)}
        onToggleTheme={handleToggleTheme}
        isPremium={isPremium}
        isDonor={isDonor}
        onOpenMembershipModal={(tab) => {
          setMembershipModalInitialTab(tab || 'membership');
          setMembershipModalOpen(true);
        }}
        onOpenAnnouncements={() => {
          setSelectedAnnouncementId(null);
          setAnnouncementsModalOpen(true);
        }}
      />

      {/* Main Content Area centered with spacious side margins (leaving sides open for future ads without cramped layout) */}
      <div className="flex-1 w-full flex justify-center py-6 sm:py-8">
        {/* Center Main Stage (Spacious center max-w-6xl / max-w-7xl, leaving clean generous side space) */}
        <main className="flex-1 min-w-0 max-w-6xl xl:max-w-7xl w-full px-4 sm:px-6 lg:px-8 space-y-8 transition-all">
          <div className="w-full space-y-10">
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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
              <div className={cardGridClass}>
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
                            })}
              </div>

              {!loadingSearch && searchResults.length > 0 && searchHasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreSearchResults}
                    disabled={loadingMoreSearch}
                    className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg border border-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {loadingMoreSearch ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}

            )}
          </div>
        ) : (
          <div
            key={activeTab}
            id={`tab-panel-${activeTab}`}
            role="tabpanel"
            className="tab-view-container w-full"
          >
            {/* TAB: ADMIN */}
            {activeTab === 'admin' && <AdminSyncPage />}

            {/* TAB: EXPLORE */}
            {activeTab === 'explore' && (
              <ExploreView 
                initialGenre={exploreGenre}
                onSelectAnime={setSelectedAnime}
                getShelfStatus={(id) => getShelfItem(id)?.status || null}
                onUpdateStatus={handleUpdateShelfStatus}
                onToggleLike={handleToggleLike}
                getIsLiked={(id) => getShelfItem(id)?.isLiked || false}
              />
            )}
            {/* 2. TAB: HOME (DISCOVER) */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Two Stacked Boards: Official Notices above, Donors/Supporters below */}
                <div className="space-y-2">
                  {/* Board 1: Notices & Platform Bulletins */}
                  <NoticeTickerMarquee
                    onOpenAnnouncements={(noticeId) => {
                      setSelectedAnnouncementId(noticeId || null);
                      setAnnouncementsModalOpen(true);
                    }}
                  />

                  {/* Board 2: Donors & Supporters Wall */}
                  <DonationTickerMarquee
                    onOpenDonate={() => {
                      setMembershipModalInitialTab('donate');
                      setMembershipModalOpen(true);
                    }}
                  />
                </div>

                {loadingInitial ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="w-full h-80 sm:h-96 rounded-2xl bg-neutral-900 border border-neutral-800" />
                    <div className="space-y-4">
                      <div className="h-6 w-48 bg-neutral-900 rounded" />
                      <div className={cardGridClass}>
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
                    onSelectGenre={(g) => handleSelectDiscoverGenre(g)}
                  />

                  {/* Discover by Genre & Theme Quick Filter Carousel */}
                  <div
                    id="discover-genre-section"
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
                          Discover by Genre & Theme
                        </span>
                      </div>
                      {discoverGenre && (
                        <button
                          id="reset-discover-genre-btn"
                          onClick={() => handleSelectDiscoverGenre(null)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-rose-500/10 cursor-pointer"
                        >
                          <span>Clear Filter</span>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 scroll-smooth">
                      <button
                        id="discover-genre-featured"
                        onClick={() => handleSelectDiscoverGenre(null)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                          discoverGenre === null
                            ? 'bg-rose-600 text-white font-semibold shadow-xs shadow-rose-950/20 border border-rose-500'
                            : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800/80'
                        }`}
                      >
                        All Featured
                      </button>
                      {DISCOVER_GENRE_PILLS.map((pill) => {
                        const isSelected = discoverGenre === pill.value;
                        return (
                          <button
                            key={pill.value}
                            id={`discover-genre-${pill.name.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => handleSelectDiscoverGenre(isSelected ? null : pill.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white font-semibold shadow-xs shadow-rose-950/20 border border-rose-500'
                                : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800/80 font-medium'
                            }`}
                          >
                            <span>{pill.name}</span>
                            {isSelected && <X className="w-3 h-3 text-rose-200 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic View: If a Genre is Selected, Show Genre Results */}
                  {discoverGenre ? (
                    <section className="flex flex-col gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/40 border border-slate-200 dark:border-neutral-800/80 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800/70">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
                                {DISCOVER_GENRE_PILLS.find((p) => p.value === discoverGenre)?.name || 'Genre'} Anime
                              </h2>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/30">
                                {discoverGenreResults.length} loaded
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-neutral-400">
                              Curated titles matching this genre from catalog & live index
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenGenreInExplore(discoverGenre)}
                            className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700"
                          >
                            <span>Open in Full Catalog</span>
                            <ArrowRight className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          </button>
                          <button
                            onClick={() => handleSelectDiscoverGenre(null)}
                            className="text-xs text-slate-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-300 font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </div>
                      </div>

                      {loadingDiscoverGenre && discoverGenreResults.length === 0 ? (
                        <div className={`${cardGridClass} animate-pulse`}>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-900 border border-neutral-800" />
                          ))}
                        </div>
                      ) : discoverGenreResults.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-slate-300 dark:border-neutral-800 rounded-2xl bg-slate-50 dark:bg-neutral-900/30">
                          <Compass className="w-8 h-8 mx-auto text-slate-400 dark:text-neutral-600 mb-2" />
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No titles found for this genre</h3>
                          <button
                            onClick={() => handleSelectDiscoverGenre(null)}
                            className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Show All Discover
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className={cardGridClass}>
                            {discoverGenreResults.map((anime, idx) => {
                              const shelfItem = getShelfItem(anime.mal_id);
                              return (
                                <AnimeCard
                                  key={`discover-genre-${anime.mal_id}-${idx}`}
                                  anime={anime}
                                  onSelect={setSelectedAnime}
                                  isLiked={shelfItem?.isLiked}
                                  onToggleLike={handleToggleLike}
                                  shelfStatus={shelfItem?.status}
                                  onUpdateShelfStatus={handleUpdateShelfStatus}
                                  onSelectGenre={(g) => handleSelectDiscoverGenre(g)}
                                />
                              );
                            })}
                          </div>

                          {discoverGenreHasMore && (
                            <div className="flex justify-center pt-4">
                              <button
                                onClick={loadMoreDiscoverGenre}
                                disabled={loadingDiscoverGenre}
                                className="px-5 py-2 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                              >
                                {loadingDiscoverGenre ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                    <span>Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Load More {DISCOVER_GENRE_PILLS.find((p) => p.value === discoverGenre)?.name || ''} Anime</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  ) : (
                    <>
                  {/* Currently Airing Row */}
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 mb-1">
                      <div className="flex items-center gap-2.5">
                        <Flame className="w-5 h-5 text-rose-500 shrink-0" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
                          Trending Airing Anime
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('rankings');
                          setRankingFilter('airing');
                        }}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition-colors"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={cardGridClass}>
                      {airingAnime.slice(0, 18).map((anime, idx) => {
                         
                         
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
                            onSelectGenre={(g) => handleSelectDiscoverGenre(g)}
                          />
                        );
                      })}
                    </div>
                  </section>

                  {/* Seasonal Highlights Row */}
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 mb-1">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-rose-500 shrink-0" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
                          This Season&apos;s Highlights
                        </h2>
                      </div>
                      <button
                        onClick={() => setActiveTab('seasonal')}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition-colors"
                      >
                        <span>Explore Season</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={cardGridClass}>
                      {seasonalAnime.slice(0, 18).map((anime, idx) => {
                         
                         
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
                    <section className="flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-2 mb-1">
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-5 h-5 text-purple-500 shrink-0" />
                          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
                            Anticipated Upcoming Releases
                          </h2>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('rankings');
                            setRankingFilter('upcoming');
                          }}
                          className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition-colors"
                        >
                          <span>View All Upcoming</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        {upcomingAnime.slice(0, 18).map((anime, idx) => {
                           
                           
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
                  <section className="p-6 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-slate-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                    <div className="space-y-2 text-center md:text-left">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                        Community Feature
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                        Have Your Say in Seasonal Prediction Polls
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-xl">
                        Vote on anime of the year candidates, upcoming movie adaptations, and battle outcomes.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('polls')}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-950/20 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Go to Predictions</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>

                  {/* All-Time Popular Classics */}
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 mb-1">
                      <div className="flex items-center gap-2.5">
                        <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
                          Most Popular Titles of All Time
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('rankings');
                          setRankingFilter('bypopularity');
                        }}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition-colors"
                      >
                        <span>Full Rankings</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={cardGridClass}>
                      {topRankedAnime.slice(0, 18).map((anime, idx) => {
                         
                         
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
                            onSelectGenre={(g) => handleSelectDiscoverGenre(g)}
                          />
                        );
                      })}
                    </div>
                  </section>
                  </>
                  )}
                </div>
              )}
              </div>
            )}

            {/* 3. TAB: THIS SEASON */}
            {activeTab === 'seasonal' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
                  <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Current Season Premieres</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                      Seasonal Anime Directory
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1">
                      Currently premiering series, sequels, and simulcasts airing this season.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-1 rounded-xl text-xs self-start sm:self-auto shadow-xs">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-neutral-700"
                    >
                      Seasonal Grid
                    </button>
                    <button
                      id="seasonal-switch-to-schedule-btn"
                      type="button"
                      onClick={() => setActiveTab('schedule')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span>Weekly Schedule</span>
                    </button>
                  </div>
                </div>

                <div className={cardGridClass}>
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
              <div className="space-y-6">
                <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs uppercase font-bold tracking-wider mb-1">
                        <Trophy className="w-4 h-4" />
                        <span>Official Scores & Community Statistics</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                        Top Anime Rankings
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1">
                        Browse the top 100 anime ranked by popularity, rating, favorites, and release across all genres and eras.
                      </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-1 rounded-xl self-start sm:self-center shadow-xs">
                      <button
                        onClick={() => setRankingViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          rankingViewMode === 'list'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                        }`}
                        title="Ranked List View"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>List</span>
                      </button>
                      <button
                        onClick={() => setRankingViewMode('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          rankingViewMode === 'grid'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                        }`}
                        title="Poster Grid View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Grid</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter chips & Dropdowns */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
                      {[
                        { id: 'bypopularity', label: 'Popularity' },
                        { id: 'airing', label: 'Top Airing' },
                        { id: 'top100', label: 'Top 100 All-Time' },
                        { id: 'favorite', label: 'Favorites' },
                        { id: 'upcoming', label: 'Anticipated' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setRankingFilter(f.id as typeof rankingFilter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            rankingFilter === f.id
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={rankingGenre}
                        onChange={(e) => setRankingGenre(e.target.value)}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
                      >
                        <option value="all">All Genres</option>
                        <option value="Action">Action</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Drama">Drama</option>
                        <option value="Fantasy">Fantasy</option>
                        <option value="Romance">Romance</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Slice of Life">Slice of Life</option>
                        <option value="Horror">Horror</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Sports">Sports</option>
                        <option value="Isekai">Isekai</option>
                      </select>
                      <select 
                        value={rankingYear}
                        onChange={(e) => setRankingYear(e.target.value)}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer shadow-xs"
                      >
                        <option value="all">All Time</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subheader info bar */}
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-medium">
                    {loadingRankings ? 'Loading top anime...' : `Showing ${topRankedAnime.length} ${topRankedAnime.length === 100 ? 'Top' : ''} Anime`}
                    {rankingGenre !== 'all' && ` • ${rankingGenre}`}
                    {rankingYear !== 'all' && ` • ${rankingYear}`}
                  </span>
                  {(rankingGenre !== 'all' || rankingYear !== 'all') && (
                    <button 
                      onClick={() => { setRankingGenre('all'); setRankingYear('all'); }}
                      className="text-rose-400 hover:text-rose-300 transition-colors font-semibold"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                {loadingRankings ? (
                  <div className={cardGridClass}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-[3/4] rounded-xl bg-neutral-900 animate-pulse border border-neutral-800"
                      />
                    ))}
                  </div>
                ) : topRankedAnime.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl max-w-lg mx-auto">
                    <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">No anime found</h3>
                    <p className="text-xs text-neutral-400 mb-4">No results matched your selected genre and year filter.</p>
                    <button
                      onClick={() => { setRankingGenre('all'); setRankingYear('all'); }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    {rankingViewMode === 'list' ? (
                      <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        {topRankedAnime.map((anime, idx) => {
                          return (
                            <div 
                              key={`top100-${anime.mal_id}-${idx}`}
                              onClick={() => setSelectedAnime(anime)}
                              className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
                            >
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex flex-col items-center justify-center w-11 sm:w-14 shrink-0">
                                  {idx === 0 ? (
                                    <div className="flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 shadow-sm shadow-amber-950/20">
                                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 leading-none">TOP</span>
                                      <span className="text-base sm:text-lg font-black font-display text-amber-600 dark:text-amber-300 leading-tight">1</span>
                                    </div>
                                  ) : idx === 1 ? (
                                    <div className="flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-300/30 border border-slate-400/50 shadow-sm">
                                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-slate-700 dark:text-slate-300 leading-none">TOP</span>
                                      <span className="text-base sm:text-lg font-black font-display text-slate-800 dark:text-slate-100 leading-tight">2</span>
                                    </div>
                                  ) : idx === 2 ? (
                                    <div className="flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-700/20 border border-amber-600/50 shadow-sm">
                                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-amber-700 dark:text-amber-500 leading-none">TOP</span>
                                      <span className="text-base sm:text-lg font-black font-display text-amber-700 dark:text-amber-400 leading-tight">3</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800/80 text-slate-700 dark:text-neutral-300 group-hover:border-slate-300 dark:group-hover:border-neutral-700 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                      <span className="text-sm sm:text-base font-bold font-mono tracking-tight">
                                        {idx + 1}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                  <img 
                                    src={anime.images?.webp?.image_url || anime.images?.jpg?.image_url} 
                                    alt={anime.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                  />
                                </div>
                                
                                <div className="flex flex-col flex-1 sm:hidden">
                                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">{anime.title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">{anime.score ? anime.score.toFixed(2) : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0 hidden sm:flex flex-col gap-1.5">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">{anime.title}</h3>
                                {anime.title_english && anime.title_english !== anime.title && (
                                  <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1">{anime.title_english}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600 dark:text-neutral-300">
                                  <span className="font-medium px-2 py-0.5 bg-slate-100 dark:bg-neutral-950 rounded border border-slate-200 dark:border-neutral-800">{anime.type || 'TV'}</span>
                                  {anime.year && <span>{anime.year}</span>}
                                  {anime.episodes && <span>• {anime.episodes} eps</span>}
                                  <span className="text-slate-400 dark:text-neutral-500">•</span>
                                  <span className={anime.status === 'Currently Airing' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                                    {anime.status}
                                  </span>
                                </div>
                                {anime.genres && anime.genres.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {anime.genres.slice(0, 4).map((g, i) => (
                                      <span key={g.name || i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800">
                                        {g.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 pl-4 border-l border-slate-200 dark:border-neutral-800 min-w-[120px]">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                  <span className="text-amber-600 dark:text-amber-400 font-black text-lg">{anime.score ? anime.score.toFixed(2) : 'N/A'}</span>
                                </div>
                                {anime.scored_by && (
                                  <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-medium uppercase tracking-wider">
                                    {(anime.scored_by / 1000).toFixed(1)}k users
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={cardGridClass}>
                        {topRankedAnime.map((anime, idx) => {
                          const shelfItem = getShelfItem(anime.mal_id);
                          return (
                            <AnimeCard
                              key={`rank-page-${anime.mal_id}-${idx}`}
                              anime={anime}
                              rank={idx + 1}
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
                  </>
                )}
              </div>
            )}

            {/* 5. TAB: MANGA */}
            {activeTab === 'manga' && (
              <MangaSection
                shelf={shelf}
                isPremium={isPremium}
                onAddToShelf={(manga, status) => {
                  const poster =
                    manga.images.webp?.large_image_url ||
                    manga.images.jpg.large_image_url ||
                    manga.images.jpg.image_url;
                  const existing = shelf.find((s) => s.id === manga.mal_id && s.mediaType === 'manga');
                  saveShelfEntry({
                    id: manga.mal_id,
                    mediaType: 'manga',
                    title: manga.title,
                    image: poster,
                    status,
                    progress: existing?.progress || 0,
                    totalUnits: manga.chapters,
                    isLiked: existing?.isLiked || false,
                    userRating: existing?.userRating,
                  });
                  setShelf(getStoredShelf());
                  setActivities(getStoredActivities());
                }}
                onToggleLike={(id, mediaType, title, image) => {
                  const updated = toggleShelfLike(id, mediaType, title, image);
                  setShelf(updated);
                  setActivities(getStoredActivities());
                }}
                initialSearchQuery={mangaSearchQuery}
              />
            )}

            {/* TAB: SCHEDULE */}
            {activeTab === 'schedule' && (
              <ScheduleView
                onSelectAnime={setSelectedAnime}
                onAddToShelf={handleAddToShelf}
                isItemInShelf={(id) => Boolean(getShelfItem(id))}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* 6. TAB: POLLS */}
            {activeTab === 'polls' && (
              <PollsView
                polls={polls}
                userVotes={userVotes}
                onVote={handleVotePoll}
                onSelectAnime={handleSelectPollAnime}
                currentUser={currentUser}
                isPremium={isPremium}
                onOpenCreatePoll={() => setCreatePollModalOpen(true)}
                onOpenMembershipModal={() => {
                  setMembershipModalInitialTab('membership');
                  setMembershipModalOpen(true);
                }}
              />
            )}

            
            {/* 8. TAB: ADVANCED SEARCH */}
            {activeTab === 'advanced' && (
              <AdvancedSearchView
                onSelectAnime={setSelectedAnime}
                getShelfStatus={(id) => getShelfItem(id)?.status || null}
                onUpdateStatus={handleUpdateShelfStatus}
                onToggleLike={handleToggleLike}
                getIsLiked={(id) => getShelfItem(id)?.isLiked || false}
              />
            )}
            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <ProfileView
                currentUser={currentUser}
                onProfileUpdated={setCurrentUser}
                onNavigateTab={setActiveTab}
                onOpenStats={() => setStatsModalOpen(true)}
                onOpenImportExport={() => setImportExportModalOpen(true)}
                onOpenAuth={() => setAuthModalOpen(true)}
                shelf={shelf}
                activities={activities}
                onSelectAnime={setSelectedAnime}
                onSelectManga={(title) => handleNavigateToManga(title)}
                shelfCount={shelf.length}
                streakInfo={streakInfo}
                onStreakUpdated={setStreakInfo}
                onOpenAccountSwitcher={() => setAccountSwitcherOpen(true)}
                savedAccountsCount={savedAccountsCount}
              />
            )}
            {activeTab === 'shelf' && (
              <ShelfView
                shelf={shelf}
                activities={activities}
                activeSubTab={shelfSubTab}
                onTabChange={(tab) => setShelfSubTab(tab)}
                onOpenStats={() => setStatsModalOpen(true)}
                onOpenImportExport={() => setImportExportModalOpen(true)}
                onSelectMedia={async (id) => {
                  const item = shelf.find((s) => s.id === id);
                  if (item) {
                    if (item.mediaType === 'manga') {
                      handleNavigateToManga(item.title);
                      return;
                    }
                    try {
                      const fullAnime = await getAnimeById(id);
                      if (fullAnime) {
                        setSelectedAnime(fullAnime);
                        return;
                      }
                    } catch {
                      // fallback to minimal object
                    }
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
          </div>
        )}
          </div>
        </main>
      </div>

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
          onSelectRelatedAnime={async (malId) => {
            try {
              const fullAnime = await getAnimeById(malId);
              if (fullAnime) {
                setSelectedAnime(fullAnime);
              }
            } catch (err) {
              console.warn('Failed to load related anime:', err);
            }
          }}
          onSelectCharacter={(charId, charName) => {
            setSelectedCharacter({ id: charId, name: charName });
          }}
          onSelectVoiceActor={(vaId, vaName) => {
            setSelectedVoiceActor({ id: vaId, name: vaName });
          }}
          onSelectGenre={(genreName) => {
            setSelectedAnime(null);
            handleSelectDiscoverGenre(genreName);
          }}
          onSelectStudio={handleSelectStudio}
          onSelectYear={handleSelectYearSeason}
          onNavigateToManga={handleNavigateToManga}
        />
      )}
      </AnimatePresence>

      {/* Character Profile Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          characterId={selectedCharacter.id}
          characterName={selectedCharacter.name}
          onClose={() => setSelectedCharacter(null)}
          onSelectAnime={(anime) => {
            setSelectedCharacter(null);
            setSelectedAnime(anime);
          }}
          onSelectVoiceActor={(personId, personName) => {
            setSelectedCharacter(null);
            setSelectedVoiceActor({ id: personId, name: personName });
          }}
        />
      )}

      {/* Voice Actor Profile Modal */}
      {selectedVoiceActor && (
        <VoiceActorModal
          personId={selectedVoiceActor.id}
          personName={selectedVoiceActor.name}
          onClose={() => setSelectedVoiceActor(null)}
          onSelectAnime={(anime) => {
            setSelectedVoiceActor(null);
            setSelectedAnime(anime);
          }}
          onSelectCharacter={(charId, charName) => {
            setSelectedVoiceActor(null);
            setSelectedCharacter({ id: charId, name: charName });
          }}
        />
      )}

      {/* Shelf Stats Analytics Modal */}
      {statsModalOpen && (
        <ShelfStatsModal
          shelf={shelf}
          onClose={() => setStatsModalOpen(false)}
        />
      )}

      {/* Shelf Library Backup & Import/Export Modal */}
      {importExportModalOpen && (
        <ShelfImportExportModal
          shelf={shelf}
          onClose={() => setImportExportModalOpen(false)}
          onImport={handleImportShelf}
        />
      )}

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
        onOpenMembershipModal={(tab) => {
          setMembershipModalInitialTab(tab || 'membership');
          setMembershipModalOpen(true);
        }}
        onOpenAnnouncements={() => {
          setSelectedAnnouncementId(null);
          setAnnouncementsModalOpen(true);
        }}
      />

      {/* Legal & Info Modal */}
      {infoModalType && (
        <InfoModal
          type={infoModalType}
          onClose={() => setInfoModalType(null)}
        />
      )}

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

      {/* Daily Streak Modal */}
      {streakModalOpen && (
        <DailyStreakModal
          userId={currentUser?.id}
          streakInfo={streakInfo}
          onStreakUpdated={setStreakInfo}
          onClose={() => setStreakModalOpen(false)}
        />
      )}

      {/* Multi-Account Switcher Modal */}
      {accountSwitcherOpen && (
        <AccountSwitcherModal
          currentUser={currentUser}
          onClose={() => setAccountSwitcherOpen(false)}
          onAccountSwitched={handleAccountSwitched}
          onOpenAddNewAccount={() => {
            setAuthModalOpen(true);
          }}
        />
      )}

      {/* Screen Appearance Modal */}
      {appearanceModalOpen && (
        <AppearanceModal
          themeMode={themeMode}
          onThemeModeChange={handleThemeModeChange}
          onClose={() => setAppearanceModalOpen(false)}
        />
      )}

      {/* Create Prediction Poll Modal */}
      {createPollModalOpen && (
        <CreatePollModal
          isOpen={createPollModalOpen}
          onClose={() => setCreatePollModalOpen(false)}
          currentUser={currentUser}
          isPremium={isPremium}
          onSubmitPoll={handleCreatePoll}
          onOpenMembershipModal={() => {
            setCreatePollModalOpen(false);
            setMembershipModalInitialTab('membership');
            setMembershipModalOpen(true);
          }}
        />
      )}

      {/* Membership & Help KuroShelf Grow (Donations) Modal */}
      {membershipModalOpen && (
        <MembershipSupportModal
          isOpen={membershipModalOpen}
          onClose={() => setMembershipModalOpen(false)}
          currentUser={currentUser}
          initialTab={membershipModalInitialTab}
          onMembershipUpdated={(newStatus: boolean) => {
            setIsPremium(newStatus);
          }}
        />
      )}

      {/* Announcements & Bulletins Modal */}
      {announcementsModalOpen && (
        <AnnouncementsModal
          currentUser={currentUser}
          onClose={() => {
            setAnnouncementsModalOpen(false);
            setSelectedAnnouncementId(null);
          }}
          selectedNoticeId={selectedAnnouncementId}
        />
      )}
    </div>
  );
}
