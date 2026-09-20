import { DailyStreakInfo, StreakMilestone } from '../types';

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

const STREAK_MILESTONES_CONFIG: Omit<StreakMilestone, 'unlocked'>[] = [
  {
    days: 3,
    title: 'Spark of Passion',
    badge: '🔥 3 Days',
    description: 'Began the habit! Logged into Kuro Shelf for 3 consecutive days.',
  },
  {
    days: 7,
    title: 'Weekly Devotion',
    badge: '⚡ 7 Days',
    description: 'A full week of anime & manga exploration without missing a day.',
  },
  {
    days: 14,
    title: 'Cour Finisher',
    badge: '⚔️ 14 Days',
    description: 'Two continuous weeks! A full single-cour dedication achieved.',
  },
  {
    days: 30,
    title: 'Season Connoisseur',
    badge: '🌟 30 Days',
    description: 'An entire month of daily activity. Mastered your seasonal watchlist.',
  },
  {
    days: 60,
    title: 'Immortal Otaku',
    badge: '👑 60 Days',
    description: 'Two months of unwavering passion and community presence.',
  },
  {
    days: 100,
    title: 'Sovereign Century',
    badge: '🏆 100 Days',
    description: '100 days of perfection. Recognized as a Kuro Shelf sovereign legend.',
  },
];

const MOTIVATIONAL_QUOTES: { quote: string; anime: string }[] = [
  { quote: 'If you do not take risks, you cannot create a future.', anime: 'One Piece' },
  { quote: 'Hard work betrays none, but dreams betray many.', anime: 'My Teen Romantic Comedy' },
  { quote: 'Push through the pain; giving up hurts more.', anime: 'Vegeta, Dragon Ball' },
  { quote: 'Whatever you lose, you will find it again. But what you throw away you will never get back.', anime: 'Rurouni Kenshin' },
  { quote: 'If you do not like your destiny, do not accept it. Instead, have the courage to change it.', anime: 'Naruto' },
  { quote: 'The ticket to the future is always open.', anime: 'Vash, Trigun' },
  { quote: 'Fear is not evil. It tells you what your weakness is.', anime: 'Gildarts, Fairy Tail' },
  { quote: 'Even if I die, I will win.', anime: 'Megumi Fushiguro, Jujutsu Kaisen' },
];

export function getMotivationalQuote(streak: number): { quote: string; anime: string } {
  const index = Math.abs(streak) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

export function getStreakMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES_CONFIG.map((m) => ({
    ...m,
    unlocked: currentStreak >= m.days,
  }));
}

export function getStreakStorageKey(userId?: string): string {
  return `kuro_streak_${userId || 'guest'}`;
}

export function getStreakInfo(userId?: string): DailyStreakInfo {
  const key = getStreakStorageKey(userId);
  const today = getLocalDateString();
  const defaultInfo: DailyStreakInfo = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    checkedInToday: false,
    streakHistory: [],
    freezeAvailable: true,
    totalCheckIns: 0,
  };

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultInfo;
    const data: DailyStreakInfo = JSON.parse(raw);

    const lastActive = data.lastActiveDate;
    if (!lastActive) {
      return { ...data, checkedInToday: false };
    }

    const daysDiff = getDaysDifference(lastActive, today);

    if (daysDiff === 0) {
      // Checked in today!
      return {
        ...data,
        checkedInToday: true,
      };
    } else if (daysDiff === 1) {
      // Last active was yesterday, streak is alive and ready to extend today
      return {
        ...data,
        checkedInToday: false,
      };
    } else if (daysDiff === 2 && data.freezeAvailable) {
      // Missed 1 day, but freeze shield protected it!
      return {
        ...data,
        checkedInToday: false,
      };
    } else {
      // Streak broken
      return {
        ...data,
        currentStreak: 0,
        checkedInToday: false,
      };
    }
  } catch (e) {
    console.warn('[Streak] Failed to parse streak info:', e);
    return defaultInfo;
  }
}

export function recordDailyCheckIn(userId?: string): {
  info: DailyStreakInfo;
  newlyClaimed: boolean;
  milestoneUnlocked?: StreakMilestone;
  freezeUsed?: boolean;
} {
  const key = getStreakStorageKey(userId);
  const today = getLocalDateString();
  const current = getStreakInfo(userId);

  // If already checked in today, don't double claim
  if (current.checkedInToday && current.lastActiveDate === today) {
    return {
      info: current,
      newlyClaimed: false,
      freezeUsed: false,
    };
  }

  let nextStreak = 1;
  let freezeUsed = false;
  let freezeAvailable = current.freezeAvailable;

  if (current.lastActiveDate) {
    const daysDiff = getDaysDifference(current.lastActiveDate, today);
    if (daysDiff === 1) {
      // Checked in yesterday, continue streak
      nextStreak = current.currentStreak + 1;
    } else if (daysDiff === 2 && current.freezeAvailable) {
      // Used freeze shield to protect
      nextStreak = current.currentStreak + 1;
      freezeUsed = true;
      freezeAvailable = false;
    } else {
      // Reset streak to 1
      nextStreak = 1;
    }
  }

  const longestStreak = Math.max(current.longestStreak, nextStreak);
  const streakHistory = Array.from(new Set([...(current.streakHistory || []), today])).slice(-30);
  const totalCheckIns = (current.totalCheckIns || 0) + 1;

  // Give freeze shield back on 7-day milestone
  if (nextStreak % 7 === 0) {
    freezeAvailable = true;
  }

  const updatedInfo: DailyStreakInfo = {
    currentStreak: nextStreak,
    longestStreak,
    lastActiveDate: today,
    checkedInToday: true,
    streakHistory,
    freezeAvailable,
    totalCheckIns,
  };

  try {
    localStorage.setItem(key, JSON.stringify(updatedInfo));
  } catch (e) {
    console.warn('[Streak] Failed to save streak info:', e);
  }

  // Check if milestone newly unlocked
  const milestones = getStreakMilestones(nextStreak);
  const milestoneUnlocked = milestones.find((m) => m.days === nextStreak);

  return {
    info: updatedInfo,
    newlyClaimed: true,
    milestoneUnlocked,
    freezeUsed,
  };
}

export function getLast7DaysStreak(streakHistory: string[] = []): {
  dayName: string;
  date: string;
  checkedIn: boolean;
  isToday: boolean;
}[] {
  const days: { dayName: string; date: string; checkedIn: boolean; isToday: boolean }[] = [];
  const today = new Date();
  const historySet = new Set(streakHistory);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = i === 0;
    const checkedIn = historySet.has(dateStr);

    days.push({
      dayName,
      date: dateStr,
      checkedIn,
      isToday,
    });
  }

  return days;
}
