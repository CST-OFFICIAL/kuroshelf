import { useState, useEffect, useRef } from 'react';
import { MangaItem, ShelfEntry, ShelfStatus, BookFormat } from '../types';
import {
  fetchBooksFromAniList,
  fetchSpotlightBooks,
  getVerifiedSeedBooks,
  fetchRanking100Books,
  fetchSeasonalBooks,
} from '../services/bookService';
import { getWeeklyPollStatus, recordPollCreation } from '../services/membershipService';
import { BookDetailModal } from './BookDetailModal';
import { MediaImage } from './MediaImage';
import {
  BookOpen,
  Star,
  Bookmark,
  Sparkles,
  X,
  ArrowRight,
  Compass,
  Flame,
  Trophy,
  Filter,
  Library,
  BookMarked,
  LayoutGrid,
  List,
  Calendar,
  Vote,
  Clock,
  Check,
  Plus,
  TrendingUp,
  Crown,
} from 'lucide-react';

interface BooksPortalViewProps {
  shelf: ShelfEntry[];
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
  onAddToShelf: (book: MangaItem, status: ShelfStatus) => void;
  onUpdateProgress: (id: number, progress: number) => void;
  onToggleLike: (id: number, title: string, image: string) => void;
  currentUser?: any;
  isPremium?: boolean;
  onOpenMembershipModal?: () => void;
  onOpenAuth?: () => void;
  onOpenShelf?: () => void;
  initialSearchQuery?: string;
}

const BOOK_GENRES = [
  'Action',
  'Fantasy',
  'Romance',
  'Psychological',
  'Isekai',
  'Seinen',
  'Shounen',
  'Slice of Life',
  'Mystery',
  'Comedy',
  'Drama',
  'Horror',
  'Supernatural',
  'Sci-Fi',
];

interface ScheduleRelease {
  id: number;
  title: string;
  chapter: string;
  publisher: string;
  time: string;
  status: string;
  format: string;
  image: string;
  origin: string;
}

const WEEKLY_BOOK_SCHEDULE: Record<string, ScheduleRelease[]> = {
  Monday: [
    {
      id: 13,
      title: 'One Piece',
      chapter: 'Chapter 1138',
      publisher: 'Weekly Shōnen Jump',
      time: '15:00 UTC',
      status: 'Simulpub Ready',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
    },
    {
      id: 162479,
      title: 'Kagurabachi',
      chapter: 'Chapter 65',
      publisher: 'Weekly Shōnen Jump',
      time: '15:00 UTC',
      status: 'Simulpub Ready',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    },
    {
      id: 131334,
      title: 'Sakamoto Days',
      chapter: 'Chapter 198',
      publisher: 'Weekly Shōnen Jump',
      time: '15:00 UTC',
      status: 'Simulpub Ready',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
    },
    {
      id: 135545,
      title: 'Blue Box',
      chapter: 'Chapter 182',
      publisher: 'Weekly Shōnen Jump',
      time: '15:00 UTC',
      status: 'Simulpub Ready',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    },
  ],
  Tuesday: [
    {
      id: 116778,
      title: 'Chainsaw Man',
      chapter: 'Chapter 189',
      publisher: 'Shōnen Jump+',
      time: '15:00 UTC',
      status: 'Bi-Weekly Simulpub',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80',
    },
    {
      id: 135496,
      title: 'Dandadan',
      chapter: 'Chapter 179',
      publisher: 'Shōnen Jump+',
      time: '15:00 UTC',
      status: 'Simulpub Ready',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&q=80',
    },
    {
      id: 130363,
      title: 'The Beginning After the End',
      chapter: 'Season 6 Episode 185',
      publisher: 'Tapas / Kakao',
      time: '17:00 UTC',
      status: 'Full Color Webtoon',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    },
  ],
  Wednesday: [
    {
      id: 114755,
      title: 'Blue Lock',
      chapter: 'Chapter 288',
      publisher: 'Weekly Shōnen Magazine',
      time: '14:00 UTC',
      status: 'Kodansha Simulpub',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
    },
    {
      id: 126287,
      title: "Frieren: Beyond Journey's End",
      chapter: 'Chapter 138',
      publisher: 'Weekly Shōnen Sunday',
      time: '16:00 UTC',
      status: 'Sunday Simulpub',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
    },
    {
      id: 7,
      title: 'Hajime no Ippo',
      chapter: 'Round 1480',
      publisher: 'Weekly Shōnen Magazine',
      time: '18:00 UTC',
      status: 'Weekly Serialization',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80',
    },
  ],
  Thursday: [
    {
      id: 132214,
      title: "Omniscient Reader's Viewpoint",
      chapter: 'Chapter 238',
      publisher: 'Naver Webtoon / Redice',
      time: '16:00 UTC',
      status: 'Webtoon Drop',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    },
    {
      id: 16765,
      title: 'Kingdom',
      chapter: 'Chapter 820',
      publisher: 'Weekly Young Jump',
      time: '15:00 UTC',
      status: 'Seinen Masterwork',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&q=80',
    },
    {
      id: 126047,
      title: 'Oshi no Ko',
      chapter: 'Special Chronicle',
      publisher: 'Weekly Young Jump',
      time: '15:00 UTC',
      status: 'Young Jump',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
    },
  ],
  Friday: [
    {
      id: 168430,
      title: 'Solo Leveling: Ragnarok',
      chapter: 'Chapter 52',
      publisher: 'KakaoPage / D&C Media',
      time: '16:00 UTC',
      status: 'Global Webtoon Drop',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80',
    },
    {
      id: 122663,
      title: 'Tower of God',
      chapter: 'Season 3 Episode 214',
      publisher: 'Naver / Line Webtoon',
      time: '16:00 UTC',
      status: 'Weekly Webtoon',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
    },
    {
      id: 123842,
      title: 'Lookism',
      chapter: 'Episode 530',
      publisher: 'PTJ Comics / Naver',
      time: '18:00 UTC',
      status: 'Friday Drop',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80',
    },
  ],
  Saturday: [
    {
      id: 642,
      title: 'Vinland Saga',
      chapter: 'Chapter 216',
      publisher: 'Monthly Afternoon',
      time: '17:00 UTC',
      status: 'Seinen Simulpub',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80',
    },
    {
      id: 70345,
      title: 'Grand Blue Dreaming',
      chapter: 'Chapter 96',
      publisher: 'Good! Afternoon',
      time: '16:00 UTC',
      status: 'Comedy Favorite',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
    },
    {
      id: 110485,
      title: 'Record of Ragnarok',
      chapter: 'Round 10 Climax',
      publisher: 'Monthly Comic Zenon',
      time: '18:00 UTC',
      status: 'Monthly Action',
      format: 'Manga',
      origin: '🇯🇵',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    },
  ],
  Sunday: [
    {
      id: 124800,
      title: 'Eleceed',
      chapter: 'Chapter 328',
      publisher: 'Naver Webtoon',
      time: '16:00 UTC',
      status: 'Sunday Special',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
    },
    {
      id: 126937,
      title: 'Wind Breaker',
      chapter: 'Part 4 Episode 122',
      publisher: 'Naver Webtoon',
      time: '16:00 UTC',
      status: 'Sports Favorite',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
    },
    {
      id: 128543,
      title: 'Nano Machine',
      chapter: 'Chapter 232',
      publisher: 'Redice Studio',
      time: '17:00 UTC',
      status: 'Murim Cultivation',
      format: 'Manhwa',
      origin: '🇰🇷',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&q=80',
    },
  ],
};

interface BookPoll {
  id: string;
  title: string;
  category: string;
  creator: string;
  endsAt: string;
  totalVotes: number;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
}

const DEFAULT_BOOK_POLLS: BookPoll[] = [
  {
    id: 'bp-1',
    title: 'Which upcoming manga is most likely to receive a Studio MAPPA or Ufotable anime adaptation announcement in 2026?',
    category: 'Anime Adaptation',
    creator: 'Kuro Editorial',
    endsAt: 'In 4 days',
    totalVotes: 1420,
    options: [
      { id: 'opt-1', text: 'Kagurabachi', votes: 624 },
      { id: 'opt-2', text: 'Centuria', votes: 298 },
      { id: 'opt-3', text: 'Sakamoto Days (Season 2)', votes: 369 },
      { id: 'opt-4', text: "Sachi's Monstrous Appetite", votes: 129 },
    ],
  },
  {
    id: 'bp-2',
    title: 'Will Solo Leveling: Ragnarok reach the #1 position on global webtoon reading charts before year-end?',
    category: 'Webtoon Hype',
    creator: 'HunterGuild',
    endsAt: 'In 6 days',
    totalVotes: 980,
    options: [
      { id: 'opt-21', text: 'Yes, definitely top of the world', votes: 568 },
      { id: 'opt-22', text: 'Close call, solidly in Top 3', votes: 304 },
      { id: 'opt-23', text: 'Unlikely to beat the original legend', votes: 108 },
    ],
  },
  {
    id: 'bp-3',
    title: 'Which legendary long-running serialized series will announce its final chapter climax next?',
    category: 'Climax & Endings',
    creator: 'OtakuArchive',
    endsAt: 'In 8 days',
    totalVotes: 2150,
    options: [
      { id: 'opt-31', text: 'One Piece (Final Saga)', votes: 817 },
      { id: 'opt-32', text: 'Detective Conan', votes: 516 },
      { id: 'opt-33', text: 'Hunter x Hunter', votes: 408 },
      { id: 'opt-34', text: 'Berserk (Studio Gaga Continuation)', votes: 409 },
    ],
  },
  {
    id: 'bp-4',
    title: 'Which publisher provides the best official English light novel physical book quality and translation?',
    category: 'Light Novels',
    creator: 'BunkobonReader',
    endsAt: 'In 12 days',
    totalVotes: 860,
    options: [
      { id: 'opt-41', text: 'Yen Press / Yen On', votes: 352 },
      { id: 'opt-42', text: 'Seven Seas Airship', votes: 249 },
      { id: 'opt-43', text: 'J-Novel Club Print Edition', votes: 155 },
      { id: 'opt-44', text: 'Square Enix Manga & Books', votes: 104 },
    ],
  },
];

export function BooksPortalView({
  shelf,
  activeTab = 'books',
  onNavigateTab,
  onAddToShelf,
  onUpdateProgress,
  onToggleLike,
  currentUser,
  isPremium = false,
  onOpenMembershipModal,
  onOpenAuth,
  onOpenShelf,
  initialSearchQuery = '',
}: BooksPortalViewProps) {
  // Determine effective format based on the active tab page
  const getFormatForTab = (tab: string): BookFormat => {
    switch (tab) {
      case 'books-manga':
        return 'manga';
      case 'books-manhwa':
        return 'manhwa';
      case 'books-manhua':
        return 'manhua';
      case 'books-novel':
        return 'novel';
      default:
        return 'all';
    }
  };

  const isRankingsPage = activeTab === 'books-rankings';
  const isGenresPage = activeTab === 'books-genres';
  const isSchedulePage = activeTab === 'books-schedule';
  const isPredictionsPage = activeTab === 'books-polls';
  const isCatalogPage = activeTab === 'books-catalog' || ['books-manga', 'books-manhwa', 'books-manhua', 'books-novel'].includes(activeTab);
  const isSeasonsPage = activeTab === 'books-seasons';

  const [selectedFormat, setSelectedFormat] = useState<BookFormat>(getFormatForTab(activeTab));
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<'Winter' | 'Spring' | 'Summer' | 'Fall'>('Spring');
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<number>(2025);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchQuery);
  
  // Schedule state
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('Monday');

  // Predictions Polls state & Weekly quota
  const quota = getWeeklyPollStatus(currentUser?.id, isPremium);
  const [pollFilterMode, setPollFilterMode] = useState<'all' | 'active' | 'voted'>('all');
  const [bookPolls, setBookPolls] = useState<BookPoll[]>(() => {
    try {
      const stored = localStorage.getItem('kuro_book_polls_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_BOOK_POLLS;
  });

  const [userPollVotes, setUserPollVotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('kuro_book_poll_votes_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  const [createPollModalOpen, setCreatePollModalOpen] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '', '']);

  // Sort states
  const [sortBy, setSortBy] = useState<'POPULARITY_DESC' | 'SCORE_DESC' | 'TRENDING_DESC' | 'FAVOURITES_DESC'>(
    isRankingsPage ? 'SCORE_DESC' : 'POPULARITY_DESC'
  );
  
  // Rankings view mode: detailed list vs card grid
  const [rankingsViewMode, setRankingsViewMode] = useState<'list' | 'grid'>('list');
  const rankingsCacheRef = useRef<Record<string, MangaItem[]>>({});

  // Data states
  const [spotlightBooks, setSpotlightBooks] = useState<MangaItem[]>([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightHovered, setIsSpotlightHovered] = useState(false);
  const [booksList, setBooksList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Selected book for details modal
  const [selectedBook, setSelectedBook] = useState<MangaItem | null>(null);

  // Synchronize format and sort when the activeTab page changes
  useEffect(() => {
    const targetFormat = getFormatForTab(activeTab);
    setSelectedFormat(targetFormat);
    setPage(1);

    if (activeTab === 'books-rankings') {
      setSortBy('SCORE_DESC');
    }
  }, [activeTab]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load spotlight carousel on mount
  useEffect(() => {
    fetchSpotlightBooks().then((res) => {
      if (res && res.length > 0) setSpotlightBooks(res);
    });
  }, []);

  // Auto rotate spotlight - pauses on cursor hover
  useEffect(() => {
    if (isSpotlightHovered || spotlightBooks.length <= 1) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightBooks.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isSpotlightHovered, spotlightBooks.length]);

  // Fetch books when page or filters change (only if not on schedule or predictions)
  useEffect(() => {
    if (isSchedulePage || isPredictionsPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // Preload top 100 ranking items for rankings page
    if (isRankingsPage) {
      const cacheKey = `${selectedFormat}_${sortBy}`;
      if (rankingsCacheRef.current[cacheKey]?.length) {
        setBooksList(rankingsCacheRef.current[cacheKey]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      fetchRanking100Books(selectedFormat, sortBy)
        .then((items) => {
          if (!isMounted) return;
          rankingsCacheRef.current[cacheKey] = items;
          setBooksList(items);
          setHasMore(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setBooksList(getVerifiedSeedBooks(selectedFormat));
          setHasMore(false);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }

    if (isSeasonsPage) {
      fetchSeasonalBooks(selectedSeasonYear, selectedFormat)
        .then((items) => {
          if (!isMounted) return;
          setBooksList(items);
          setHasMore(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setBooksList(getVerifiedSeedBooks(selectedFormat).filter((b) => b.publishing));
          setHasMore(false);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }

    fetchBooksFromAniList({
      format: selectedFormat,
      genre: selectedGenre !== 'all' ? selectedGenre : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: debouncedSearch.trim() || undefined,
      sort: sortBy,
      page: 1,
      perPage: 24,
    })
      .then((res) => {
        if (!isMounted) return;
        setBooksList(res.data);
        setHasMore(res.hasNextPage);
      })
      .catch(() => {
        if (!isMounted) return;
        setBooksList(getVerifiedSeedBooks(selectedFormat));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFormat, selectedGenre, selectedStatus, debouncedSearch, sortBy, isRankingsPage, isSchedulePage, isPredictionsPage, isSeasonsPage, selectedSeasonYear]);

  // Load more pages
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    try {
      const res = await fetchBooksFromAniList({
        format: selectedFormat,
        genre: selectedGenre !== 'all' ? selectedGenre : undefined,
        search: debouncedSearch.trim() || undefined,
        sort: sortBy,
        page: nextPage,
        perPage: isRankingsPage ? 30 : 24,
      });
      setBooksList((prev) => [...prev, ...res.data]);
      setPage(nextPage);
      setHasMore(res.hasNextPage);
    } catch {
      setHasMore(false);
    }
  };

  // Vote on a book poll
  const handleVoteBookPoll = (pollId: string, optionId: string) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const previousOptionId = userPollVotes[pollId];
    if (previousOptionId === optionId) return;

    const updatedPolls = bookPolls.map((poll) => {
      if (poll.id !== pollId) return poll;
      const updatedOptions = poll.options.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (previousOptionId && opt.id === previousOptionId) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      });
      const newTotal = previousOptionId ? poll.totalVotes : poll.totalVotes + 1;
      return { ...poll, options: updatedOptions, totalVotes: newTotal };
    });

    const newVotes = { ...userPollVotes, [pollId]: optionId };
    setBookPolls(updatedPolls);
    setUserPollVotes(newVotes);

    try {
      localStorage.setItem('kuro_book_polls_v1', JSON.stringify(updatedPolls));
      localStorage.setItem('kuro_book_poll_votes_v1', JSON.stringify(newVotes));
    } catch {}
  };

  // Create new poll
  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter((opt) => opt.trim().length > 0);
    if (validOptions.length < 2) return;

    const newPoll: BookPoll = {
      id: `bp-${Date.now()}`,
      title: newPollQuestion.trim(),
      category: 'Community Poll',
      creator: currentUser?.display_name || currentUser?.username || 'Otaku Member',
      endsAt: 'In 7 days',
      totalVotes: 0,
      options: validOptions.map((text, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: text.trim(),
        votes: 0,
      })),
    };

    const updated = [newPoll, ...bookPolls];
    setBookPolls(updated);
    recordPollCreation(newPoll.id, currentUser?.id);
    try {
      localStorage.setItem('kuro_book_polls_v1', JSON.stringify(updated));
    } catch {}

    setNewPollQuestion('');
    setNewPollOptions(['', '', '']);
    setCreatePollModalOpen(false);
  };

  const currentSpotlight = spotlightBooks[spotlightIndex] || spotlightBooks[0] || null;

  const getShelfItem = (id: number) => {
    return shelf.find((s) => s.id === id && s.mediaType === 'manga');
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in pb-16">
      {/* ========================================================================= */}
      {/* 1. PAGE HERO HEADERS (Different banner for each dedicated page)            */}
      {/* ========================================================================= */}

      {/* DISCOVER HUB PAGE HERO: SPOTLIGHT CAROUSEL BANNER */}
      {(!isCatalogPage && !isSeasonsPage && !isRankingsPage && !isGenresPage && !isSchedulePage && !isPredictionsPage) && currentSpotlight && (
        <section 
          aria-label="Featured Book Spotlight"
          onMouseEnter={() => setIsSpotlightHovered(true)}
          onMouseLeave={() => setIsSpotlightHovered(false)}
          className="relative w-full rounded-3xl overflow-hidden bg-[#0e121b] border border-slate-800 shadow-2xl min-h-[380px] sm:min-h-[440px] flex items-center group transition-all"
        >
          {/* Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={
                currentSpotlight.bannerImage ||
                currentSpotlight.images.webp?.large_image_url ||
                currentSpotlight.images.jpg.large_image_url
              }
              alt=""
              className="w-full h-full object-cover filter blur-xs scale-105 opacity-30 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e121b] via-[#0e121b]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e121b] via-transparent to-black/40" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Featured {currentSpotlight.type || 'Book'}
              </span>
              {currentSpotlight.countryOfOrigin && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700">
                  {currentSpotlight.countryOfOrigin === 'KR'
                    ? '🇰🇷 Korean Webtoon'
                    : currentSpotlight.countryOfOrigin === 'CN'
                    ? '🇨🇳 Chinese Manhua'
                    : '🇯🇵 Japanese Manga'}
                </span>
              )}
              {typeof currentSpotlight.score === 'number' && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {currentSpotlight.score.toFixed(1)}
                </span>
              )}
              {currentSpotlight.genres?.slice(0, 3).map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => {
                    setSelectedGenre(g.name);
                    if (onNavigateTab) onNavigateTab('books-genres');
                  }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  {g.name}
                </button>
              ))}
            </div>

            <div>
              <h1 
                onClick={() => setSelectedBook(currentSpotlight)}
                className="text-2xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-tight cursor-pointer hover:text-emerald-400 transition-colors"
              >
                {currentSpotlight.title}
              </h1>
              {currentSpotlight.title_english && currentSpotlight.title_english !== currentSpotlight.title && (
                <p 
                  onClick={() => setSelectedBook(currentSpotlight)}
                  className="text-xs sm:text-sm text-slate-400 hover:text-emerald-300 font-medium mt-1 cursor-pointer transition-colors"
                >
                  {currentSpotlight.title_english}
                </p>
              )}
            </div>

            {currentSpotlight.synopsis && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-2xl">
                {currentSpotlight.synopsis}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBook(currentSpotlight)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const onShelf = getShelfItem(currentSpotlight.mal_id);
                  onAddToShelf(currentSpotlight, onShelf?.status || 'watching');
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all border border-slate-700 cursor-pointer flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <span>
                  {getShelfItem(currentSpotlight.mal_id) ? 'In Your Shelf' : 'Add to Shelf'}
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CATALOG DEDICATED PAGE HERO WITH CLICKABLE FORMAT FILTERS */}
      {isCatalogPage && (
        <section className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#101726] via-[#0d121d] to-[#070a10] border border-slate-800 shadow-xl space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" /> Complete Library Archive
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Manga • Manhwa • Manhua • Light Novels
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight hover:text-emerald-400 transition-colors cursor-default">
              Literature & Graphic Novel Catalog
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Explore the complete international catalog of Japanese Manga, Korean Webtoons, Chinese Manhua, and Light Novels. Filter by category, demographic, genre, status, or search any title.
            </p>
          </div>

          {/* Interactive Format Filter Buttons inside Catalog */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Category & Format:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: 'all', label: 'All Books', count: 'Complete Archive', icon: BookOpen, color: 'text-emerald-400' },
                { id: 'manga', label: '🇯🇵 Manga', count: 'Japanese Serials', icon: BookMarked, color: 'text-rose-400' },
                { id: 'manhwa', label: '🇰🇷 Manhwa', count: 'Korean Webtoons', icon: Flame, color: 'text-amber-400' },
                { id: 'manhua', label: '🇨🇳 Manhua', count: 'Chinese Comics', icon: Sparkles, color: 'text-purple-400' },
                { id: 'novel', label: '📚 Light Novels', count: 'Web Adaptations', icon: Library, color: 'text-cyan-400' },
              ].map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(fmt.id as BookFormat);
                      setPage(1);
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                        : 'bg-[#10141e] hover:bg-[#151a27] border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <fmt.icon className={`w-5 h-5 mb-2 ${fmt.color} group-hover:scale-110 transition-transform`} />
                    <div className={`text-sm font-black transition-colors ${isSelected ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>
                      {fmt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {fmt.count}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* THIS SEASON DEDICATED PAGE HERO */}
      {isSeasonsPage && (
        <section className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#131f24] via-[#0d161a] to-[#070b0e] border border-emerald-500/30 shadow-xl space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Seasonal Releases & Simulpubs
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {selectedSeason} {selectedSeasonYear}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight hover:text-emerald-400 transition-colors cursor-default">
              This Season's Book Releases
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Explore currently releasing manga serializations, weekly manhwa chapters, and light novel volume releases dropping during {selectedSeason} {selectedSeasonYear}.
            </p>
          </div>

          {/* Season & Year Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['Winter', 'Spring', 'Summer', 'Fall'] as const).map((season) => {
                const isSelected = selectedSeason === season;
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => setSelectedSeason(season)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {season} {selectedSeasonYear}
                  </button>
                );
              })}
            </div>

            {/* Year & Format Sub-Filters in Seasonal view */}
            <div className="flex items-center gap-2">
              <select
                value={selectedSeasonYear}
                onChange={(e) => setSelectedSeasonYear(Number(e.target.value))}
                className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>

              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value as BookFormat);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Formats</option>
                <option value="manga">Manga Only</option>
                <option value="manhwa">Manhwa Only</option>
                <option value="novel">Light Novels Only</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* RANKINGS DEDICATED PAGE HERO (NO SEARCH BUTTON, PURE LEADERBOARD) */}
      {isRankingsPage && (
        <section className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#1c1810] via-[#141009] to-[#0a0804] border border-amber-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                  <Trophy className="w-3.5 h-3.5" /> Hall of Fame & Leaderboard
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800/90 text-amber-300 border border-amber-500/30">
                  All Literary Formats
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight hover:text-amber-400 transition-colors cursor-default">
                Top Manga & Books Rankings
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                The greatest literary masterworks ranked by global score ratings, community popularity, and critical acclaim.
              </p>
            </div>

            {/* View Switcher (List vs Grid) */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 gap-1 self-start md:self-center">
              <button
                type="button"
                onClick={() => setRankingsViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  rankingsViewMode === 'list'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Detailed Leaderboard List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setRankingsViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  rankingsViewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card Grid</span>
              </button>
            </div>
          </div>

          {/* Ranking Category Tabs & Format Filter (Zero Search Input / Button) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'SCORE_DESC' as const, label: '🏆 Highest Rated' },
                { id: 'POPULARITY_DESC' as const, label: '🔥 Most Popular' },
                { id: 'TRENDING_DESC' as const, label: '📈 Trending Now' },
                { id: 'FAVOURITES_DESC' as const, label: '❤️ Most Favorited' },
              ].map((cat) => {
                const isSelected = sortBy === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSortBy(cat.id);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/40'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Format sub-filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value as BookFormat);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Formats</option>
                <option value="manga">Manga Only</option>
                <option value="manhwa">Manhwa Only</option>
                <option value="manhua">Manhua Only</option>
                <option value="novel">Novels Only</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* SCHEDULE DEDICATED PAGE HERO */}
      {isSchedulePage && (
        <section className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#121824] via-[#0d121c] to-[#07090e] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Weekly Chapter Simulpub Calendar
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Shōnen Jump • Naver • Kakao • MangaPlus
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight hover:text-blue-400 transition-colors cursor-default">
            Manga & Webtoon Release Schedule
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Track weekly digital chapter drops, official English simulpubs, and magazine updates across Japan, Korea, and China.
          </p>

          {/* Day of Week Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin pt-2 border-t border-slate-800">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const isSelected = selectedScheduleDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedScheduleDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-500/40'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* PREDICTIONS & POLLS DEDICATED PAGE HERO */}
      {isPredictionsPage && (
        <section className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#1a1226] via-[#110c1c] to-[#08060f] border border-purple-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500 text-white flex items-center gap-1.5 shadow-sm">
                  <Vote className="w-3.5 h-3.5" /> Literary Community Predictions
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-purple-300 border border-purple-500/30">
                  {bookPolls.length} Active Polls
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight hover:text-purple-400 transition-colors cursor-default">
                Manga & Book Predictions
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Cast your vote on upcoming anime adaptation announcements, major arc climaxes, and publishing milestones.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  if (onOpenAuth) onOpenAuth();
                  return;
                }
                setCreatePollModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-purple-950/40 flex items-center gap-2 self-start sm:self-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Prediction</span>
            </button>
          </div>
        </section>
      )}

      {/* GENRES DEDICATED PAGE HERO */}
      {isGenresPage && (
        <section className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#121c20] via-[#0b1418] to-[#060b0e] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Literary Genre Directory
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight hover:text-emerald-400 transition-colors cursor-default">
            Browse Books by Genre
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Select any genre to explore top rated manga, webtoons, and light novels across diverse narrative themes, demographic tags, and settings.
          </p>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. DISCOVER HUB QUICK PORTALS (Catalog, Seasons, Rankings, Schedule, Polls)*/}
      {/* ========================================================================= */}
      {!isCatalogPage && !isSeasonsPage && !isRankingsPage && !isGenresPage && !isSchedulePage && !isPredictionsPage && (
        <section aria-label="Library Navigation Portals" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                Library Navigation
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                Explore The Library
              </h2>
            </div>

            {onOpenShelf && (
              <button
                type="button"
                onClick={onOpenShelf}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all self-start sm:self-auto cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Reading Shelf</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: 'genres', label: 'Browse Genres', count: 'Explore All Themes', icon: Filter, color: 'text-emerald-400', tab: 'books-genres' },
              { id: 'seasons', label: 'This Season', count: 'Current Releases', icon: Sparkles, color: 'text-rose-400', tab: 'books-seasons' },
              { id: 'rankings', label: 'Top 100 Rankings', count: 'Hall of Fame', icon: Trophy, color: 'text-amber-400', tab: 'books-rankings' },
              { id: 'catalog', label: 'Complete Catalog', count: 'Manga, Manhwa & Novels', icon: Library, color: 'text-cyan-400', tab: 'books-catalog' },
              { id: 'schedule', label: 'Release Schedule', count: 'Weekly Drops', icon: Calendar, color: 'text-blue-400', tab: 'books-schedule' },
              { id: 'polls', label: 'Predictions', count: 'Community Votes', icon: Vote, color: 'text-purple-400', tab: 'books-polls' },
            ].map((portal) => (
              <button
                key={portal.id}
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab(portal.tab);
                  }
                }}
                className="p-4 rounded-2xl border text-left transition-all cursor-pointer group bg-[#10141e] hover:bg-[#151a27] border-slate-800 hover:border-slate-700"
              >
                <portal.icon className={`w-5 h-5 mb-2 ${portal.color} group-hover:scale-110 transition-transform`} />
                <div className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                  {portal.label}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {portal.count}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. SORT & GENRE FILTER TOOLBAR (Hidden in Rankings, Schedule, Polls, Seasons)*/}
      {/* ========================================================================= */}
      {!isRankingsPage && !isSchedulePage && !isPredictionsPage && !isSeasonsPage && (
        <section 
          aria-label="Books Filter Options"
          className="p-3.5 sm:p-4 rounded-2xl bg-[#0e121b] border border-slate-800 shadow-sm space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Publication Status Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 sm:h-11 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="RELEASING">Publishing</option>
                  <option value="FINISHED">Finished</option>
                </select>
              </div>

              {/* Sub-format filter selector if in Genres page */}
              {isGenresPage && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedFormat}
                    onChange={(e) => {
                      setSelectedFormat(e.target.value as BookFormat);
                      setPage(1);
                    }}
                    className="h-10 sm:h-11 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Formats</option>
                    <option value="manga">Manga Only</option>
                    <option value="manhwa">Manhwa Only</option>
                    <option value="manhua">Manhua Only</option>
                    <option value="novel">Novels Only</option>
                  </select>
                </div>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="h-11 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="POPULARITY_DESC">Most Popular</option>
                <option value="SCORE_DESC">Highest Rated</option>
                <option value="TRENDING_DESC">Trending Now</option>
                <option value="FAVOURITES_DESC">Most Favorited</option>
              </select>
            </div>
          </div>

          {/* Genre Pill Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                setSelectedGenre('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedGenre === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Genres
            </button>
            {BOOK_GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setSelectedGenre(g);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedGenre === g
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. SCHEDULE VIEW (Rendered when activeTab === 'books-schedule')            */}
      {/* ========================================================================= */}
      {isSchedulePage && (
        <section aria-label="Manga Release Schedule List" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>{selectedScheduleDay} Chapter Drops</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              {(WEEKLY_BOOK_SCHEDULE[selectedScheduleDay] || []).length} scheduled drops
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(WEEKLY_BOOK_SCHEDULE[selectedScheduleDay] || []).map((item) => {
              const shelfItem = getShelfItem(item.id);
              return (
                <div
                  key={`sched-${item.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#10141e] border border-slate-800/90 hover:border-blue-500/40 transition-all shadow-sm"
                >
                  <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-700/60 bg-slate-900">
                    <MediaImage
                      src={item.image}
                      alt={item.title}
                      title={item.title}
                      mediaType="manga"
                      aspectRatio="aspect-[16/24]"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{item.origin}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {item.format}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {item.time}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-blue-400 font-semibold">
                      {item.chapter}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.publisher} • {item.status}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const bookStub: any = {
                        mal_id: item.id,
                        title: item.title,
                        type: item.format,
                        images: { jpg: { large_image_url: item.image }, webp: { large_image_url: item.image } },
                      };
                      onAddToShelf(bookStub, shelfItem ? 'watching' : 'watching');
                    }}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      shelfItem
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{shelfItem ? 'On Shelf' : '+ Add'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. PREDICTIONS VIEW (Rendered when activeTab === 'books-polls')             */}
      {/* ========================================================================= */}
      {isPredictionsPage && (
        <section aria-label="Manga Community Predictions List" className="space-y-6">
          {/* Header */}
          <div className="border-b border-slate-800 pb-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-purple-400 text-xs uppercase font-bold tracking-wider mb-1">
                  <Vote className="w-4 h-4" />
                  <span>Community Predictions</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  Manga & Literary Community Predictions
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Predict upcoming chapter releases, plot revelations, anime adaptations, and character milestones.
                </p>
              </div>

              {/* Action Trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuth?.();
                      return;
                    }
                    if (quota.remaining <= 0) {
                      if (onOpenMembershipModal) {
                        onOpenMembershipModal();
                      }
                      return;
                    }
                    setCreatePollModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Make Prediction Poll</span>
                </button>
              </div>
            </div>

            {/* Guest Banner if not signed in */}
            {!currentUser && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white text-xs">Account Required to Participate in Predictions</p>
                    <p className="text-[11px] text-slate-300">Open an account or sign in to vote in weekly matchups and make your own predictions!</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-950/40 cursor-pointer shrink-0"
                >
                  Open Account / Sign In
                </button>
              </div>
            )}

            {/* Weekly Quota Card & VIP Perks */}
            <div className="p-4 rounded-2xl bg-[#10141e] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-xs">Your Weekly Poll Creation Quota:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                      quota.remaining > 0
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {quota.used} of {quota.limit} used this week
                  </span>
                  {isPremium ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      VIP (7 Polls/Wk)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Standard (1 Poll/Wk)</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Free members receive <strong>1 poll creation per week</strong>. Kuro VIP members receive{' '}
                  <strong>7 poll creations per week</strong>. Open an account to participate and vote on unlimited prediction polls!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isPremium && onOpenMembershipModal ? (
                  <button
                    type="button"
                    onClick={onOpenMembershipModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-[11px] transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to 7 Polls/Wk</span>
                  </button>
                ) : isPremium ? (
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    <span>VIP Active</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-1.5 bg-[#10141e] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPollFilterMode('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pollFilterMode === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Polls ({bookPolls.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPollFilterMode('active')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pollFilterMode === 'active'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setPollFilterMode('voted')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pollFilterMode === 'voted'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  My Votes ({Object.keys(userPollVotes).length})
                </button>
              </div>

              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Live community predictions & real-time tally
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {bookPolls
              .filter((poll) => {
                if (pollFilterMode === 'voted') return Boolean(userPollVotes[poll.id]);
                return true;
              })
              .map((poll) => {
                const votedOptId = userPollVotes[poll.id];
              return (
                <div
                  key={poll.id}
                  className="p-5 sm:p-6 rounded-3xl bg-[#10141e] border border-slate-800 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30">
                      {poll.category}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {poll.endsAt}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {poll.title}
                  </h3>

                  {/* Options with live percentage bars */}
                  <div className="space-y-2.5 pt-1">
                    {poll.options.map((opt) => {
                      const isVoted = votedOptId === opt.id;
                      const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleVoteBookPoll(poll.id, opt.id)}
                          className={`relative w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                            isVoted
                              ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-950/30'
                              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {/* Progress fill bar */}
                          {poll.totalVotes > 0 && (
                            <div
                              className={`absolute inset-0 opacity-20 pointer-events-none transition-all duration-500 ${
                                isVoted ? 'bg-purple-500' : 'bg-slate-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between gap-3 text-xs sm:text-sm">
                            <span className="font-bold flex items-center gap-2">
                              {isVoted && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                              <span>{opt.text}</span>
                            </span>
                            <span className="font-mono font-black text-xs shrink-0 text-slate-400">
                              {percentage}% ({opt.votes})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80 font-medium">
                    <span>By {poll.creator}</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-400">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                      {poll.totalVotes} total votes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create Poll Modal */}
          {createPollModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-3xl bg-[#0e121b] border border-slate-800 p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white font-display">
                    Create Community Prediction
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCreatePollModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Question / Topic
                    </label>
                    <input
                      type="text"
                      required
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      placeholder="e.g. Which manga will announce an anime in 2026?"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Poll Options (Min. 2)
                    </label>
                    {newPollOptions.map((opt, i) => (
                      <input
                        key={i}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newPollOptions];
                          updated[i] = e.target.value;
                          setNewPollOptions(updated);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    ))}
                    {newPollOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setNewPollOptions([...newPollOptions, ''])}
                        className="text-xs text-purple-400 font-bold hover:underline cursor-pointer"
                      >
                        + Add another option
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setCreatePollModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      Publish Prediction
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. RESULTS SECTION (Standard Pages & Rankings)                            */}
      {/* ========================================================================= */}
      {!isSchedulePage && !isPredictionsPage && (
        <section aria-label="Book Results" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
              <span>
                {debouncedSearch
                  ? `Results for "${debouncedSearch}"`
                  : isRankingsPage
                  ? `Hall of Fame Leaderboard (${sortBy === 'SCORE_DESC' ? 'Highest Rated' : sortBy === 'POPULARITY_DESC' ? 'Most Popular' : sortBy === 'TRENDING_DESC' ? 'Trending' : 'Most Favorited'})`
                  : isSeasonsPage
                  ? `${selectedSeason} ${selectedSeasonYear} Book Releases`
                  : isCatalogPage
                  ? (selectedFormat === 'manga'
                    ? 'Japanese Manga Catalog'
                    : selectedFormat === 'manhwa'
                    ? 'Korean Manhwa Catalog'
                    : selectedFormat === 'manhua'
                    ? 'Chinese Manhua Catalog'
                    : selectedFormat === 'novel'
                    ? 'Light Novels Catalog'
                    : 'Complete Literature Catalog')
                  : isGenresPage && selectedGenre !== 'all'
                  ? `${selectedGenre} Titles`
                  : 'Popular & Acclaimed Books'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({booksList.length} items)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-2xl bg-slate-900 animate-pulse border border-slate-800"
                />
              ))}
            </div>
          ) : booksList.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-[#0e121b] border border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Books Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We couldn't find any titles matching your search and filter criteria. Try clearing the genre or format filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGenre('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : isRankingsPage && rankingsViewMode === 'list' ? (
            /* ========================================================================= */
            /* RANKINGS DETAILED LEADERBOARD LIST VIEW (Clean, No Search Clutter)         */
            /* ========================================================================= */
            <div className="space-y-3">
              {booksList.map((book, idx) => {
                const poster =
                  book.images.webp?.large_image_url ||
                  book.images.jpg.large_image_url ||
                  book.images.jpg.image_url;

                const isKR = book.type === 'Manhwa' || book.countryOfOrigin === 'KR';
                const isNovel = book.type?.toLowerCase().includes('novel') || book.format === 'NOVEL';
                const isCN = book.type === 'Manhua' || book.countryOfOrigin === 'CN';

                return (
                  <div
                    key={`rank-book-${book.mal_id}-${idx}`}
                    className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#10141e] hover:bg-[#141a27] border border-slate-800/90 hover:border-amber-500/40 transition-all gap-4 shadow-sm"
                  >
                    {/* Left: Rank Badge + Uniform Poster + Structured Info */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Rank Badge */}
                      <div className="flex flex-col items-center justify-center w-10 sm:w-12 shrink-0">
                        {idx === 0 ? (
                          <div className="flex flex-col items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 shadow-sm shadow-amber-950/20">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-amber-500 leading-none">TOP</span>
                            <span className="text-base sm:text-lg font-black font-display text-amber-400 leading-tight">1</span>
                          </div>
                        ) : idx === 1 ? (
                          <div className="flex flex-col items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-300/20 border border-slate-400/50 shadow-sm">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-slate-300 leading-none">TOP</span>
                            <span className="text-base sm:text-lg font-black font-display text-slate-200 leading-tight">2</span>
                          </div>
                        ) : idx === 2 ? (
                          <div className="flex flex-col items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-700/20 border border-amber-600/50 shadow-sm">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-amber-600 leading-none">TOP</span>
                            <span className="text-base sm:text-lg font-black font-display text-amber-500 leading-tight">3</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                            <span className="text-sm sm:text-base font-bold font-mono">
                              {idx + 1}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Uniform Book Poster Thumbnail (Same size like Vinland Saga) */}
                      <div
                        onClick={() => setSelectedBook(book)}
                        className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-sm bg-slate-900 cursor-pointer"
                      >
                        <MediaImage
                          images={book.images}
                          src={poster}
                          alt={book.title}
                          title={book.title}
                          mediaType="manga"
                          aspectRatio="aspect-[20/28]"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Structured Info: Title at Top, Description in Middle with Ellipsis, Genres at Bottom */}
                      <div 
                        onClick={() => setSelectedBook(book)}
                        className="flex-1 min-w-0 cursor-pointer flex flex-col justify-between h-28 py-0.5"
                      >
                        {/* Title and Origin / Format Badges */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {isNovel ? 'Novel' : isKR ? 'Manhwa' : isCN ? 'Manhua' : 'Manga'}
                            </span>
                            {isKR && <span className="text-xs">🇰🇷</span>}
                            {isCN && <span className="text-xs">🇨🇳</span>}
                            {!isKR && !isCN && !isNovel && <span className="text-xs">🇯🇵</span>}
                            {book.chapters && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                {book.chapters} Chapters
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {book.title}
                          </h3>
                        </div>

                        {/* Reserved Description Slot: ... if no space, space stays if too short */}
                        <div className="h-9 sm:h-10 overflow-hidden my-auto">
                          <p className="text-xs text-slate-400 line-clamp-2 leading-snug">
                            {book.synopsis ? book.synopsis : <span className="italic text-slate-600">No synopsis available for this title.</span>}
                          </p>
                        </div>

                        {/* Genre listing at exact same place across all rows */}
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {book.genres && book.genres.length > 0 ? (
                            book.genres.slice(0, 4).map((g, gi) => (
                              <span
                                key={`bg-${g.name || gi}`}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 shrink-0"
                              >
                                {g.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800 shrink-0">
                              General
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Score + Readers (Surface Add Button Removed) */}
                    <div className="flex flex-col items-end justify-center shrink-0 pl-3 sm:pl-4 sm:border-l sm:border-slate-800 min-w-[90px]">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-amber-400 font-black text-base sm:text-lg">
                          {book.score ? book.score.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      {typeof book.popularity === 'number' && book.popularity > 0 && (
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                          {(book.popularity / 1000).toFixed(1)}k readers
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================================= */
            /* STANDARD CARD GRID VIEW                                                   */
            /* ========================================================================= */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {booksList.map((book, idx) => {
                const shelfItem = getShelfItem(book.mal_id);
                const poster =
                  book.images.webp?.large_image_url ||
                  book.images.jpg.large_image_url ||
                  book.images.jpg.image_url;

                const isKR = book.type === 'Manhwa' || book.countryOfOrigin === 'KR';
                const isNovel = book.type?.toLowerCase().includes('novel') || book.format === 'NOVEL';
                const isCN = book.type === 'Manhua' || book.countryOfOrigin === 'CN';

                return (
                  <div
                    key={`book-card-${book.mal_id || 'item'}-${idx}`}
                    className="group relative flex flex-col rounded-2xl bg-[#10141e] border border-slate-800/90 overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-950/20"
                  >
                    {/* Poster Thumbnail */}
                    <div
                      onClick={() => setSelectedBook(book)}
                      className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden cursor-pointer"
                    >
                      <MediaImage
                        images={book.images}
                        src={poster}
                        alt={book.title}
                        title={book.title}
                        mediaType="manga"
                        aspectRatio="aspect-[3/4]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Rankings number badge if on rankings page */}
                      {isRankingsPage && (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md font-black text-xs shadow-md ${
                          idx === 0
                            ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-black/80 text-white'
                        }`}>
                          #{idx + 1}
                        </div>
                      )}

                      {/* Format Pill (if not on rankings page) */}
                      {!isRankingsPage && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-black text-emerald-400 uppercase tracking-wider border border-white/10">
                          {isNovel ? 'Novel' : isKR ? 'Manhwa' : isCN ? 'Manhua' : 'Manga'}
                        </div>
                      )}

                      {/* Score badge */}
                      {typeof book.score === 'number' && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-slate-950" />
                          <span>{book.score.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Status ribbon if on shelf */}
                      {shelfItem && (
                        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-bold flex items-center justify-between shadow-sm">
                          <span className="capitalize">{shelfItem.status}</span>
                          {typeof shelfItem.progress === 'number' && (
                            <span>Ch. {shelfItem.progress}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div 
                        onClick={() => setSelectedBook(book)}
                        className="space-y-1 cursor-pointer"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors leading-snug">
                          {book.title}
                        </h3>
                        {book.chapters && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {book.chapters} Chapters
                          </span>
                        )}
                      </div>

                      {/* Quick shelf action (Hidden on Rankings to keep clean surface view) */}
                      {!isRankingsPage && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus: ShelfStatus = shelfItem ? (shelfItem.status === 'watching' ? 'completed' : 'watching') : 'watching';
                            onAddToShelf(book, nextStatus);
                          }}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            shelfItem
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{shelfItem ? 'On Shelf' : '+ Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more button */}
          {hasMore && !loading && (
            <div className="pt-6 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
              >
                Load More Books
              </button>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. BOOK DETAILS MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          shelf={shelf}
          onClose={() => setSelectedBook(null)}
          onUpdateStatus={(_id, status) => onAddToShelf(selectedBook, status)}
          onUpdateProgress={onUpdateProgress}
          onToggleLike={(id, title, image) => onToggleLike(id, title, image)}
          isLoggedIn={Boolean(currentUser)}
          onRequireAuth={onOpenAuth}
        />
      )}
    </div>
  );
}
