import { ShelfEntry, UserActivity, PredictionPoll, ShelfStatus } from '../types';

const STORAGE_KEYS = {
  SHELF: 'kuroshelf_items',
  ACTIVITIES: 'kuroshelf_activities',
  POLLS: 'kuroshelf_polls',
  VOTES: 'kuroshelf_user_votes',
};

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

export function getStoredShelf(): ShelfEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHELF);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveShelfEntry(entry: Omit<ShelfEntry, 'updatedAt'>): ShelfEntry[] {
  const shelf = getStoredShelf();
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
    });
  } else {
    newShelf = [updatedEntry, ...shelf];
    logActivity({
      mediaId: entry.id,
      title: entry.title,
      mediaType: entry.mediaType,
      action: 'added',
      details: `Added ${entry.title} to ${formatStatus(entry.status)}`,
    });
  }

  localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));
  return newShelf;
}

export function removeShelfEntry(id: number, mediaType: 'anime' | 'manga'): ShelfEntry[] {
  const shelf = getStoredShelf();
  const target = shelf.find((item) => item.id === id && item.mediaType === mediaType);
  const newShelf = shelf.filter((item) => !(item.id === id && item.mediaType === mediaType));
  localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));

  if (target) {
    logActivity({
      mediaId: id,
      title: target.title,
      mediaType,
      action: 'status_changed',
      details: `Removed ${target.title} from shelf`,
    });
  }

  return newShelf;
}

export function toggleShelfLike(id: number, mediaType: 'anime' | 'manga', title: string, image: string): ShelfEntry[] {
  const shelf = getStoredShelf();
  const existingIdx = shelf.findIndex((item) => item.id === id && item.mediaType === mediaType);

  if (existingIdx >= 0) {
    const isNowLiked = !shelf[existingIdx].isLiked;
    const newShelf = [...shelf];
    newShelf[existingIdx] = {
      ...newShelf[existingIdx],
      isLiked: isNowLiked,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'liked',
      details: isNowLiked ? `Liked ${title}` : `Unliked ${title}`,
    });
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
    localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'liked',
      details: `Favorited and saved ${title} to shelf`,
    });
    return newShelf;
  }
}

export function setShelfRating(id: number, mediaType: 'anime' | 'manga', score: number, title: string, image: string): ShelfEntry[] {
  const shelf = getStoredShelf();
  const existingIdx = shelf.findIndex((item) => item.id === id && item.mediaType === mediaType);

  if (existingIdx >= 0) {
    const newShelf = [...shelf];
    newShelf[existingIdx] = {
      ...newShelf[existingIdx],
      userRating: score,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'rated',
      details: `Rated ${title} ${score}/10`,
    });
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
    localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));
    logActivity({
      mediaId: id,
      title,
      mediaType,
      action: 'rated',
      details: `Rated ${title} ${score}/10 and saved to completed`,
    });
    return newShelf;
  }
}

export function updateShelfProgress(id: number, mediaType: 'anime' | 'manga', progress: number): ShelfEntry[] {
  const shelf = getStoredShelf();
  const existingIdx = shelf.findIndex((item) => item.id === id && item.mediaType === mediaType);
  if (existingIdx < 0) return shelf;

  const newShelf = [...shelf];
  newShelf[existingIdx] = {
    ...newShelf[existingIdx],
    progress: Math.max(0, progress),
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(newShelf));
  return newShelf;
}

export function getStoredActivities(): UserActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function logActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>) {
  try {
    const existing = getStoredActivities();
    const newActivity: UserActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    const updated = [newActivity, ...existing].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
  } catch {
    // Ignore storage issues
  }
}

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
