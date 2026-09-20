import { ShelfEntry, UserActivity, PredictionPoll, ShelfStatus } from '../types';

const STORAGE_KEYS = {
  SHELF: 'kuroshelf_items',
  ACTIVITIES: 'kuroshelf_activities',
  POLLS: 'kuroshelf_polls',
  VOTES: 'kuroshelf_user_votes',
};

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

function getShelfStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return uid === 'default' ? STORAGE_KEYS.SHELF : `kuroshelf_items_${uid}`;
}

function getActivitiesStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return uid === 'default' ? STORAGE_KEYS.ACTIVITIES : `kuroshelf_activities_${uid}`;
}

const PRESET_SHELVES: Record<string, ShelfEntry[]> = {
  acc_ren_mangasavant: [
    {
      id: 2,
      mediaType: 'manga',
      title: 'Berserk',
      image: 'https://cdn.myanimelist.net/images/manga/1/157897.jpg',
      status: 'completed',
      userRating: 10,
      isLiked: true,
      progress: 364,
      totalUnits: 364,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 1,
      mediaType: 'manga',
      title: 'Monster',
      image: 'https://cdn.myanimelist.net/images/manga/3/258224.jpg',
      status: 'completed',
      userRating: 10,
      isLiked: true,
      progress: 162,
      totalUnits: 162,
      updatedAt: Date.now() - 86400000 * 5,
    },
    {
      id: 642,
      mediaType: 'manga',
      title: 'Vinland Saga',
      image: 'https://cdn.myanimelist.net/images/manga/2/188040.jpg',
      status: 'watching',
      userRating: 9,
      isLiked: true,
      progress: 210,
      updatedAt: Date.now() - 86400000,
    },
  ],
  acc_sakura_animereviewer: [
    {
      id: 52991,
      mediaType: 'anime',
      title: 'Sousou no Frieren',
      image: 'https://cdn.myanimelist.net/images/anime/1015/138025.jpg',
      status: 'completed',
      userRating: 10,
      isLiked: true,
      progress: 28,
      totalUnits: 28,
      updatedAt: Date.now() - 86400000 * 3,
    },
    {
      id: 47917,
      mediaType: 'anime',
      title: 'Bocchi the Rock!',
      image: 'https://cdn.myanimelist.net/images/anime/1448/127956.jpg',
      status: 'completed',
      userRating: 9,
      isLiked: true,
      progress: 12,
      totalUnits: 12,
      updatedAt: Date.now() - 86400000 * 6,
    },
    {
      id: 52578,
      mediaType: 'anime',
      title: 'Boku no Kokoro no Yabai Yatsu',
      image: 'https://cdn.myanimelist.net/images/anime/1739/134448.jpg',
      status: 'watching',
      userRating: 9,
      isLiked: true,
      progress: 8,
      updatedAt: Date.now() - 86400000,
    },
  ],
};

export function getStoredShelf(userId?: string): ShelfEntry[] {
  try {
    const key = getShelfStorageKey(userId);
    let raw = localStorage.getItem(key);
    
    // Seed preset account shelf if first time
    const targetUid = userId || getActiveUserId();
    if (!raw && PRESET_SHELVES[targetUid]) {
      localStorage.setItem(key, JSON.stringify(PRESET_SHELVES[targetUid]));
      raw = JSON.stringify(PRESET_SHELVES[targetUid]);
    } else if (!raw && (targetUid === 'default' || targetUid === 'kuro_admin_master')) {
      const fallback = localStorage.getItem(STORAGE_KEYS.SHELF);
      if (fallback) raw = fallback;
    }

    if (!raw) return [];
    const parsed: ShelfEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let hasNsfw = false;
    const cleanShelf = parsed.filter((item) => {
      if (!item) return false;
      const t = String(item.title || '').toLowerCase();
      if (
        item.id === 34246 ||
        t.includes('rina witch') ||
        t.includes('kimi no mana wa') ||
        t.includes('your magical name is rina')
      ) {
        hasNsfw = true;
        return false;
      }
      return true;
    });

    if (hasNsfw) {
      localStorage.setItem(key, JSON.stringify(cleanShelf));
    }

    return cleanShelf;
  } catch {
    return [];
  }
}

export function saveShelfEntry(entry: Omit<ShelfEntry, 'updatedAt'>, userId?: string): ShelfEntry[] {
  const shelf = getStoredShelf(userId);
  const existingIdx = shelf.findIndex((item) => item.id === entry.id && item.mediaType === entry.mediaType);
  const updatedEntry: ShelfEntry = {
    ...entry,
    updatedAt: Date.now(),
  };

  let newShelf: ShelfEntry[];
  if (existingIdx >= 0) {
    newShelf = [...shelf];
    newShelf[existingIdx] = updatedEntry;
    logActivity({
      mediaId: entry.id,
      title: entry.title,
      mediaType: entry.mediaType,
      action: 'status_changed',
      details: `Updated ${entry.title} status to ${formatStatus(entry.status)}`,
    }, userId);
  } else {
    newShelf = [updatedEntry, ...shelf];
    logActivity({
      mediaId: entry.id,
      title: entry.title,
      mediaType: entry.mediaType,
      action: 'added',
      details: `Added ${entry.title} to ${formatStatus(entry.status)}`,
    }, userId);
  }

  const key = getShelfStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(newShelf));
  return newShelf;
}

export function removeShelfEntry(id: number, mediaType: 'anime' | 'manga', userId?: string): ShelfEntry[] {
  const shelf = getStoredShelf(userId);
  const target = shelf.find((item) => item.id === id && item.mediaType === mediaType);
  const newShelf = shelf.filter((item) => !(item.id === id && item.mediaType === mediaType));
  const key = getShelfStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(newShelf));

  if (target) {
    logActivity({
      mediaId: id,
      title: target.title,
      mediaType,
      action: 'status_changed',
      details: `Removed ${target.title} from shelf`,
    }, userId);
  }

  return newShelf;
}

export function toggleShelfLike(id: number, mediaType: 'anime' | 'manga', title: string, image: string, userId?: string): ShelfEntry[] {
  const shelf = getStoredShelf(userId);
  const existingIdx = shelf.findIndex((item) => item.id === id && item.mediaType === mediaType);
  const key = getShelfStorageKey(userId);

  if (existingIdx >= 0) {
    const isNowLiked = !shelf[existingIdx].isLiked;
    const newShelf = [...shelf];
    newShelf[existingIdx] = {
      ...newShelf[existingIdx],
      isLiked: isNowLiked,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'liked',
      details: isNowLiked ? `Liked ${title}` : `Unliked ${title}`,
    }, userId);
    return newShelf;
  } else {
    // Add as plan_to_watch with like
    const newEntry: ShelfEntry = {
      id,
      mediaType,
      title,
      image,
      status: 'plan_to_watch',
      isLiked: true,
      progress: 0,
      updatedAt: Date.now(),
    };
    const newShelf = [newEntry, ...shelf];
    localStorage.setItem(key, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'liked',
      details: `Favorited and saved ${title} to shelf`,
    }, userId);
    return newShelf;
  }
}

export function setShelfRating(id: number, mediaType: 'anime' | 'manga', score: number, title: string, image: string, userId?: string): ShelfEntry[] {
  const shelf = getStoredShelf(userId);
  const existingIdx = shelf.findIndex((item) => item.id === id && item.mediaType === mediaType);
  const key = getShelfStorageKey(userId);

  if (existingIdx >= 0) {
    const newShelf = [...shelf];
    newShelf[existingIdx] = {
      ...newShelf[existingIdx],
      userRating: score,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'rated',
      details: `Rated ${title} ${score}/10`,
    }, userId);
    return newShelf;
  } else {
    const newEntry: ShelfEntry = {
      id,
      mediaType,
      title,
      image,
      status: 'completed',
      userRating: score,
      isLiked: false,
      progress: 0,
      updatedAt: Date.now(),
    };
    const newShelf = [newEntry, ...shelf];
    localStorage.setItem(key, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'rated',
      details: `Rated ${title} ${score}/10 and saved to completed`,
    }, userId);
    return newShelf;
  }
}

export function updateShelfProgress(id: number, mediaType: 'anime' | 'manga', progress: number, userId?: string): ShelfEntry[] {
  const shelf = getStoredShelf(userId);
  const existingIdx = shelf.findIndex((item) => item.id === id && item.mediaType === mediaType);
  if (existingIdx < 0) return shelf;

  const newShelf = [...shelf];
  newShelf[existingIdx] = {
    ...newShelf[existingIdx],
    progress: Math.max(0, progress),
    updatedAt: Date.now(),
  };
  const key = getShelfStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(newShelf));
  return newShelf;
}

export function getStoredActivities(userId?: string): UserActivity[] {
  try {
    const key = getActivitiesStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function logActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>, userId?: string) {
  try {
    const existing = getStoredActivities(userId);
    const newActivity: UserActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    const updated = [newActivity, ...existing].slice(0, 30);
    const key = getActivitiesStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore storage issues
  }
}

const INITIAL_POLLS: PredictionPoll[] = [
  {
    id: 'poll-1',
    animeTitle: 'Demon Slayer: Kimetsu no Yaiba - Infinity Castle',
    animeId: 58514,
    question: 'Will the Infinity Castle Arc movie trilogy break global box office anime records?',
    totalVotes: 0,
    status: 'active',
    endsAt: '2026-12-31T23:59:59Z',
    options: [
      { id: 'opt-1', text: 'Yes, surpassing Mugen Train easily', votes: 0 },
      { id: 'opt-2', text: 'Top 3, but Mugen Train stays #1', votes: 0 },
      { id: 'opt-3', text: 'No, domestic Japan only records', votes: 0 },
    ],
  },
  {
    id: 'poll-2',
    animeTitle: 'Jujutsu Kaisen Season 3 (Culling Game)',
    question: 'Who will have the most impactful battle sequence in the Culling Game adaptation?',
    totalVotes: 0,
    status: 'active',
    endsAt: '2026-11-15T23:59:59Z',
    options: [
      { id: 'opt-2a', text: 'Yuta Okkotsu in Sendai Colony', votes: 0 },
      { id: 'opt-2b', text: 'Kinji Hakari vs. Kashimo', votes: 0 },
      { id: 'opt-2c', text: 'Megumi Fushiguro vs. Reggie Star', votes: 0 },
    ],
  },
  {
    id: 'poll-3',
    animeTitle: 'Chainsaw Man – Reze Arc',
    question: 'Which element of the Reze Arc movie are you most anticipating?',
    totalVotes: 0,
    status: 'active',
    endsAt: '2026-10-30T23:59:59Z',
    options: [
      { id: 'opt-3a', text: 'MAPPA cinema-grade bomb action choreography', votes: 0 },
      { id: 'opt-3b', text: 'Denji & Reze dynamic & romantic tension', votes: 0 },
      { id: 'opt-3c', text: 'Original cinematic soundtrack by Kensuke Ushio', votes: 0 },
    ],
  },
];

export function getStoredPolls(): PredictionPoll[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POLLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(INITIAL_POLLS));
      return INITIAL_POLLS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_POLLS;
  }
}

export function getUserVotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function castPollVote(pollId: string, optionId: string): { polls: PredictionPoll[]; votes: Record<string, string> } {
  const votes = getUserVotes();
  if (votes[pollId]) {
    return { polls: getStoredPolls(), votes };
  }

  const polls = getStoredPolls();
  const targetPoll = polls.find((p) => p.id === pollId);
  if (!targetPoll) return { polls, votes };

  targetPoll.options = targetPoll.options.map((opt) =>
    opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
  );
  targetPoll.totalVotes += 1;

  votes[pollId] = optionId;

  localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(polls));
  localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));

  return { polls, votes };
}

export function formatStatus(status: ShelfStatus): string {
  switch (status) {
    case 'watching':
      return 'Watching';
    case 'plan_to_watch':
      return 'Plan to Watch';
    case 'completed':
      return 'Completed';
    case 'on_hold':
      return 'On Hold';
    case 'dropped':
      return 'Dropped';
  }
}
