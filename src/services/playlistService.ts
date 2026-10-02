import { WatchlistPlaylist, WatchlistItem, ShelfEntry } from '../types';

const STORAGE_PREFIX = 'kuroshelf_playlists_';
const MONTHLY_CLAIMED_PREFIX = 'kuroshelf_claimed_monthly_';

function getActiveUserId(): string {
  try {
    const raw = localStorage.getItem('kuro_local_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.id) return u.id;
    }
  } catch {}
  return 'default';
}

function getPlaylistStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return `${STORAGE_PREFIX}${uid}`;
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Curated database of hand-tailored, algorithmic spotlight anime and manga
 * categorized by tropes, genres, and themes for AI monthly drops.
 */
const AI_SPOTLIGHT_CATALOG: Array<Omit<WatchlistItem, 'addedAt'> & { primaryGenre: string; keywords: string[] }> = [
  {
    id: 52991,
    mediaType: 'anime',
    title: "Frieren: Beyond Journey's End",
    image: 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg',
    score: 9.38,
    genres: ['Adventure', 'Drama', 'Fantasy'],
    primaryGenre: 'Fantasy',
    keywords: ['magic', 'wholesome', 'slow burn', 'masterpiece', 'journey'],
    reason: 'Top Rated • Deep Worldbuilding & Emotional Pacing',
  },
  {
    id: 105398,
    mediaType: 'manga',
    title: 'Solo Leveling',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg',
    score: 8.85,
    genres: ['Action', 'Fantasy'],
    primaryGenre: 'Action',
    keywords: ['system', 'dungeon', 'overpowered', 'hunter', 'shadow'],
    reason: 'High Adrenaline • Legendary Underdog to Monarch Progression',
  },
  {
    id: 51009,
    mediaType: 'anime',
    title: 'Jujutsu Kaisen Season 2',
    image: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
    score: 8.82,
    genres: ['Action', 'Fantasy', 'Supernatural'],
    primaryGenre: 'Action',
    keywords: ['curse', 'supernatural', 'intense', 'shounen', 'animation'],
    reason: 'Dynamic Animation • Shibuya Incident Peak Arc',
  },
  {
    id: 54492,
    mediaType: 'anime',
    title: 'The Apothecary Diaries',
    image: 'https://cdn.myanimelist.net/images/anime/1708/138033.jpg',
    score: 8.89,
    genres: ['Drama', 'Mystery'],
    primaryGenre: 'Mystery',
    keywords: ['historical', 'detective', 'poison', 'palace', 'smart mc'],
    reason: 'Intriguing Intellect • Palace Mystery & Clever Deduction',
  },
  {
    id: 57334,
    mediaType: 'anime',
    title: 'Dandadan',
    image: 'https://cdn.myanimelist.net/images/anime/1792/145899.jpg',
    score: 8.76,
    genres: ['Action', 'Comedy', 'Supernatural'],
    primaryGenre: 'Comedy',
    keywords: ['aliens', 'ghosts', 'chaotic', 'romance', 'action'],
    reason: 'Chaotic & Stylish • High-Octane Paranormal Romance',
  },
  {
    id: 119257,
    mediaType: 'manga',
    title: 'Omniscient Reader',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-2c52QzR50xYc.jpg',
    score: 8.92,
    genres: ['Action', 'Fantasy', 'Psychological'],
    primaryGenre: 'Fantasy',
    keywords: ['apocalypse', 'system', 'smart', 'constellations', 'novel'],
    reason: 'Mind-Bending Lore • Reader Surviving an Apocalyptic Novel',
  },
  {
    id: 56942,
    mediaType: 'anime',
    title: 'Blue Box',
    image: 'https://cdn.myanimelist.net/images/anime/1169/145618.jpg',
    score: 8.35,
    genres: ['Romance', 'Sports'],
    primaryGenre: 'Romance',
    keywords: ['badminton', 'basketball', 'pure', 'school', 'dedication'],
    reason: 'Heartwarming Synergy • Youth Athletics & Pure Romance',
  },
  {
    id: 44511,
    mediaType: 'anime',
    title: 'Chainsaw Man',
    image: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
    score: 8.52,
    genres: ['Action', 'Fantasy', 'Horror'],
    primaryGenre: 'Horror',
    keywords: ['devils', 'dark', 'gritty', 'denji', 'cinema'],
    reason: 'Visceral & Cinematic • Gritty Urban Dark Fantasy',
  },
  {
    id: 30002,
    mediaType: 'manga',
    title: 'Berserk',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg',
    score: 9.47,
    genres: ['Action', 'Adventure', 'Dark Fantasy'],
    primaryGenre: 'Action',
    keywords: ['dark', 'medieval', 'struggle', 'guts', 'griffith'],
    reason: 'All-Time Classic • The Pinnacle of Dark Fantasy Manga',
  },
  {
    id: 48583,
    mediaType: 'anime',
    title: 'Attack on Titan: Final Season',
    image: 'https://cdn.myanimelist.net/images/anime/1000/110531.jpg',
    score: 8.95,
    genres: ['Action', 'Drama', 'Suspense'],
    primaryGenre: 'Action',
    keywords: ['titans', 'freedom', 'war', 'moral ambiguity', 'eren'],
    reason: 'Climactic Epic • High Stakes Geopolitical Tragedy',
  },
  {
    id: 101517,
    mediaType: 'manga',
    title: 'SPY x FAMILY',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg',
    score: 8.62,
    genres: ['Action', 'Comedy'],
    primaryGenre: 'Comedy',
    keywords: ['espionage', 'family', 'telepath', 'wholesome', 'anya'],
    reason: 'Family Espionage • Wholesome Comedy & Clandestine Missions',
  },
  {
    id: 85470,
    mediaType: 'manga',
    title: 'Wind Breaker (Webtoon)',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85470-iL9a8t1yX288.jpg',
    score: 8.58,
    genres: ['Sports', 'Drama'],
    primaryGenre: 'Sports',
    keywords: ['cycling', 'crew', 'speed', 'street', 'underdog'],
    reason: 'High Velocity • Street Cycling & Unbreakable Bonds',
  }
];

/**
 * Gets all user playlists
 */
export function getStoredPlaylists(userId?: string): WatchlistPlaylist[] {
  try {
    const key = getPlaylistStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Playlists] Load error:', err);
  }
  return [];
}

/**
 * Saves or updates a playlist
 */
export function savePlaylist(playlist: WatchlistPlaylist, userId?: string): WatchlistPlaylist {
  const playlists = getStoredPlaylists(userId);
  const existingIdx = playlists.findIndex((p) => p.id === playlist.id);

  const updated: WatchlistPlaylist = {
    ...playlist,
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    playlists[existingIdx] = updated;
  } else {
    playlists.unshift(updated);
  }

  try {
    const key = getPlaylistStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(playlists));
  } catch (err) {
    console.warn('[Playlists] Save error:', err);
  }

  return updated;
}

/**
 * Deletes a playlist by ID
 */
export function deletePlaylist(playlistId: string, userId?: string): void {
  const playlists = getStoredPlaylists(userId).filter((p) => p.id !== playlistId);
  try {
    const key = getPlaylistStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(playlists));
  } catch (err) {
    console.warn('[Playlists] Delete error:', err);
  }
}

/**
 * Adds an item to a specific playlist
 */
export function addItemToPlaylist(
  playlistId: string,
  item: Omit<WatchlistItem, 'addedAt'>,
  userId?: string
): boolean {
  const playlists = getStoredPlaylists(userId);
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return false;

  const exists = target.items.some((i) => i.id === item.id && i.mediaType === item.mediaType);
  if (exists) return false;

  const newItem: WatchlistItem = {
    ...item,
    addedAt: Date.now(),
  };

  target.items.unshift(newItem);
  target.updatedAt = Date.now();

  try {
    const key = getPlaylistStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(playlists));
    return true;
  } catch (err) {
    console.warn('[Playlists] Add item error:', err);
    return false;
  }
}

/**
 * Removes an item from a playlist
 */
export function removeItemFromPlaylist(
  playlistId: string,
  itemId: number,
  mediaType: 'anime' | 'manga',
  userId?: string
): void {
  const playlists = getStoredPlaylists(userId);
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return;

  target.items = target.items.filter((i) => !(i.id === itemId && i.mediaType === mediaType));
  target.updatedAt = Date.now();

  try {
    const key = getPlaylistStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(playlists));
  } catch (err) {
    console.warn('[Playlists] Remove item error:', err);
  }
}

/**
 * Checks if the user already claimed or saved this month's AI Watchlist
 */
export function hasClaimedMonthlyWatchlist(monthYear: string = getCurrentMonthYear(), userId?: string): boolean {
  try {
    const uid = userId || getActiveUserId();
    const key = `${MONTHLY_CLAIMED_PREFIX}${uid}_${monthYear.replace(/\s+/g, '_')}`;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks the monthly AI watchlist as claimed/added
 */
export function markMonthlyWatchlistClaimed(monthYear: string = getCurrentMonthYear(), userId?: string): void {
  try {
    const uid = userId || getActiveUserId();
    const key = `${MONTHLY_CLAIMED_PREFIX}${uid}_${monthYear.replace(/\s+/g, '_')}`;
    localStorage.setItem(key, 'true');
  } catch (err) {
    console.warn('[Playlists] Claim mark error:', err);
  }
}

export const MIN_ANIME_FOR_RECOMMENDATIONS = 10;

/**
 * Returns the count of anime on the user's watchlist (plan to watch / pending),
 * watching, or completed list combined.
 */
export function getEligibleAnimeCount(shelf: ShelfEntry[]): number {
  return shelf.filter(
    (item) =>
      item.mediaType === 'anime' &&
      (item.status === 'watching' || item.status === 'plan_to_watch' || item.status === 'completed')
  ).length;
}

/**
 * Checks if user has at least 10 anime on watchlist, watching, or completed combined.
 */
export function isEligibleForMonthlyRecommendations(shelf: ShelfEntry[]): boolean {
  return getEligibleAnimeCount(shelf) >= MIN_ANIME_FOR_RECOMMENDATIONS;
}

/**
 * Algorithmic AI Watchlist Generator:
 * Generates an individualized monthly watchlist tailored to the user's shelf taste.
 * If user shelf is small or empty, serves the curated Monthly Season Spotlight.
 */
export function generateMonthlyAiWatchlist(
  shelf: ShelfEntry[], 
  monthYear: string = getCurrentMonthYear(),
  userName?: string
): WatchlistPlaylist {
  // 1. Analyze shelf taste profile
  const genreWeights: Record<string, number> = {};
  let totalLikedOrRated = 0;

  for (const entry of shelf) {
    if (entry.mediaType !== 'anime') continue;
    const weight = (entry.userRating && entry.userRating >= 8 ? 3 : 1) + (entry.isLiked ? 2 : 0);
    totalLikedOrRated++;
    // Use title heuristics or existing catalog keywords if available
    const lowerTitle = entry.title.toLowerCase();
    if (lowerTitle.includes('frieren') || lowerTitle.includes('fantasy') || lowerTitle.includes('slime')) {
      genreWeights['Fantasy'] = (genreWeights['Fantasy'] || 0) + weight;
    }
    if (lowerTitle.includes('jujutsu') || lowerTitle.includes('solo') || lowerTitle.includes('titan') || lowerTitle.includes('demon') || lowerTitle.includes('hero')) {
      genreWeights['Action'] = (genreWeights['Action'] || 0) + weight;
    }
    if (lowerTitle.includes('berserk') || lowerTitle.includes('ghoul') || lowerTitle.includes('chainsaw')) {
      genreWeights['Horror'] = (genreWeights['Horror'] || 0) + weight;
    }
    if (lowerTitle.includes('box') || lowerTitle.includes('horimiya') || lowerTitle.includes('love') || lowerTitle.includes('romance') || lowerTitle.includes('dress-up')) {
      genreWeights['Romance'] = (genreWeights['Romance'] || 0) + weight;
    }
    if (lowerTitle.includes('apothecary') || lowerTitle.includes('note') || lowerTitle.includes('monster') || lowerTitle.includes('dandadan')) {
      genreWeights['Mystery'] = (genreWeights['Mystery'] || 0) + weight;
    }
    if (lowerTitle.includes('haikyu') || lowerTitle.includes('wind') || lowerTitle.includes('blue lock') || lowerTitle.includes('sports')) {
      genreWeights['Sports'] = (genreWeights['Sports'] || 0) + weight;
    }
  }

  // Find user's top favorite genre
  const topGenre = Object.entries(genreWeights).sort((a, b) => b[1] - a[1])[0]?.[0];

  // 2. Select curated 8-10 titles matching affinity + seasonal balance
  const selectedItems: WatchlistItem[] = [];
  const shelfIds = new Set(shelf.map((s) => s.id));

  // Score candidate items based on user genre affinity
  const scoredCandidates = AI_SPOTLIGHT_CATALOG.map((item) => {
    let affinity = item.score || 8.0;
    if (topGenre && (item.primaryGenre === topGenre || item.genres?.includes(topGenre))) {
      affinity += 3.5;
    }
    // Give bonus to items not already on their shelf so they discover something new!
    if (!shelfIds.has(item.id)) {
      affinity += 2.0;
    }
    return { item, affinity };
  });

  scoredCandidates.sort((a, b) => b.affinity - a.affinity);

  // Take the top 8 items
  const now = Date.now();
  for (const { item } of scoredCandidates.slice(0, 8)) {
    const customizedReason = topGenre && (item.primaryGenre === topGenre || item.genres?.includes(topGenre))
      ? `✨ Curated for your affinity with ${topGenre} & high ratings`
      : item.reason;

    selectedItems.push({
      id: item.id,
      mediaType: item.mediaType,
      title: item.title,
      image: item.image,
      score: item.score,
      genres: item.genres,
      reason: customizedReason,
      addedAt: now,
    });
  }

  const playlistId = `ai_monthly_${monthYear.toLowerCase().replace(/\s+/g, '_')}`;
  const displayName = userName ? `For ${userName}` : 'For You';

  return {
    id: playlistId,
    name: displayName,
    description: topGenre
      ? `Algorithmic monthly recommendation tailored to your favorite ${topGenre} and high-rated titles on Kuro Shelf.`
      : `Algorithmic monthly recommendation featuring the top critical picks and seasonal highlights for ${monthYear}.`,
    isAiCurated: true,
    monthYear,
    items: selectedItems,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Claims and adds the monthly AI playlist directly into the user's permanent playlists
 */
export function claimAndAddMonthlyPlaylist(playlist: WatchlistPlaylist, userId?: string): WatchlistPlaylist {
  const saved = savePlaylist(playlist, userId);
  markMonthlyWatchlistClaimed(playlist.monthYear || getCurrentMonthYear(), userId);
  return saved;
}
