import { UserProfileCustomization, OtakuBadge, ShelfEntry, UserActivity } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  category: string;
  badge: string;
  bgColor: string;
  svgIcon: string;
}

export interface BannerTheme {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  accentColor: string;
  pattern: 'grid' | 'dots' | 'radial' | 'waves' | 'lines' | 'singularity' | 'aurora' | 'corona';
  isAdminOnly?: boolean;
  visualEffect?: 'singularity' | 'aurora' | 'corona';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'ronin',
    name: 'Shadow Ronin',
    category: 'Action',
    badge: 'Swordmaster',
    bgColor: 'from-rose-600 to-neutral-950',
    svgIcon: '🗡️'
  },
  {
    id: 'netrunner',
    name: 'Neo Netrunner',
    category: 'Cyberpunk',
    badge: 'Hacker',
    bgColor: 'from-cyan-500 to-blue-950',
    svgIcon: '⚡'
  },
  {
    id: 'sorcerer',
    name: 'Void Sorcerer',
    category: 'Fantasy',
    badge: 'Arcane',
    bgColor: 'from-purple-600 to-indigo-950',
    svgIcon: '🔮'
  },
  {
    id: 'shonen_flame',
    name: 'Solar Shonen',
    category: 'Adventure',
    badge: 'Hero',
    bgColor: 'from-amber-500 to-red-950',
    svgIcon: '🔥'
  },
  {
    id: 'mecha_pilot',
    name: 'Mecha Pilot',
    category: 'Sci-Fi',
    badge: 'Ace Pilot',
    bgColor: 'from-blue-600 to-slate-950',
    svgIcon: '🤖'
  },
  {
    id: 'sakura_blade',
    name: 'Sakura Blossom',
    category: 'Romance & Drama',
    badge: 'Grace',
    bgColor: 'from-pink-500 to-rose-950',
    svgIcon: '🌸'
  },
  {
    id: 'alchemist',
    name: 'Runic Alchemist',
    category: 'Mystery',
    badge: 'Philosopher',
    bgColor: 'from-emerald-500 to-teal-950',
    svgIcon: '✨'
  },
  {
    id: 'retro_otaku',
    name: 'Retro 90s',
    category: 'Classic',
    badge: 'Cassette',
    bgColor: 'from-violet-500 to-fuchsia-950',
    svgIcon: '📼'
  },
  {
    id: 'esper',
    name: 'Silver Esper',
    category: 'Psychological',
    badge: 'Mind',
    bgColor: 'from-sky-400 to-indigo-950',
    svgIcon: '👁️'
  },
  {
    id: 'manga_inker',
    name: 'Manga Sensei',
    category: 'Slice of Life',
    badge: 'Artisan',
    bgColor: 'from-neutral-400 to-neutral-900',
    svgIcon: '✒️'
  },
  {
    id: 'abyssal_lord',
    name: 'Abyssal Monarch',
    category: 'Dark Fantasy',
    badge: 'Apex',
    bgColor: 'from-red-600 to-black',
    svgIcon: '👑'
  },
  {
    id: 'starlight_idol',
    name: 'Starlight Idol',
    category: 'Music',
    badge: 'Performer',
    bgColor: 'from-yellow-400 to-rose-950',
    svgIcon: '⭐'
  }
];

export const BANNER_THEMES: BannerTheme[] = [
  // Community Banners (Available to all users)
  {
    id: 'cyberpunk',
    name: 'Neo-Tokyo Midnight',
    tagline: 'Cybernetic rain & neon pulse',
    gradient: 'from-slate-950 via-indigo-950 to-rose-950',
    accentColor: '#f43f5e',
    pattern: 'grid'
  },
  {
    id: 'sakura_dusk',
    name: 'Sakura Dusk',
    tagline: 'Cherry blossom twilight horizon',
    gradient: 'from-neutral-950 via-purple-950 to-pink-950',
    accentColor: '#ec4899',
    pattern: 'radial'
  },
  {
    id: 'shonen_ember',
    name: 'Blazing Embers',
    tagline: 'High-octane fiery determination',
    gradient: 'from-neutral-950 via-stone-900 to-amber-950',
    accentColor: '#f59e0b',
    pattern: 'dots'
  },
  {
    id: 'manga_screentone',
    name: 'Monochrome Manga',
    tagline: 'Crisp screentones & action speedlines',
    gradient: 'from-neutral-950 via-neutral-900 to-neutral-950',
    accentColor: '#e5e5e5',
    pattern: 'lines'
  },
  {
    id: 'ghibli_emerald',
    name: 'Emerald Forest',
    tagline: 'Serene nature & wandering spirits',
    gradient: 'from-neutral-950 via-teal-950 to-emerald-950',
    accentColor: '#10b981',
    pattern: 'waves'
  },
  {
    id: 'synthwave',
    name: 'Synthwave Skyline',
    tagline: 'Retro futuristic grid and violet skies',
    gradient: 'from-neutral-950 via-violet-950 to-fuchsia-950',
    accentColor: '#a855f7',
    pattern: 'grid'
  },
  // Exclusive Admin Banners (Hidden from normal users)
  {
    id: 'kuro_sovereign',
    name: 'Kuro-Ryu Sovereign Void',
    tagline: 'Imperial Black Dragon erupting through the void frame with crimson astral flames',
    gradient: 'from-black via-[#18020a] to-[#2c0310]',
    accentColor: '#f43f5e',
    pattern: 'singularity',
    isAdminOnly: true,
    visualEffect: 'singularity'
  },
  {
    id: 'celestial_shogun',
    name: 'Solar Shenron Ascension',
    tagline: 'Golden Dragon of the Heavens with radiant sun rays and imperial dragon pearl',
    gradient: 'from-[#03030c] via-[#0d0728] to-[#1c0836]',
    accentColor: '#fbbf24',
    pattern: 'aurora',
    isAdminOnly: true,
    visualEffect: 'aurora'
  },
  {
    id: 'abyssal_eclipse',
    name: 'Abyssal Leviathan',
    tagline: 'Deep Void Dragon with bioluminescent thunder and cosmic singularity scales',
    gradient: 'from-black via-[#1f0902] to-[#0d0103]',
    accentColor: '#fb923c',
    pattern: 'corona',
    isAdminOnly: true,
    visualEffect: 'corona'
  }
];

export const AVAILABLE_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller'
];

export interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_preset?: string;
  avatar_frame_color?: 'rose' | 'cyan' | 'amber' | 'violet' | 'emerald';
  role?: 'admin' | 'user';
  bio?: string;
  shelfCount?: number;
  levelTitle?: string;
}

export const INITIAL_COMMUNITY_USERS: FollowUser[] = [
  {
    id: 'user_kuro_admin',
    username: 'Kuro',
    display_name: 'Kuro',
    avatar_preset: 'ronin',
    avatar_frame_color: 'rose',
    role: 'admin',
    bio: 'Founder & Administrator of Kuro Shelf. Master of the archives.',
    shelfCount: 420,
    levelTitle: 'Grandmaster Curator'
  },
  {
    id: 'user_spike_99',
    username: 'SpikeSpiegel',
    display_name: 'Spike',
    avatar_preset: 'retro_otaku',
    avatar_frame_color: 'cyan',
    role: 'user',
    bio: 'Bounty hunter wandering the stars. Space jazz & noir enthusiast.',
    shelfCount: 154,
    levelTitle: 'Seasoned Marathoner'
  },
  {
    id: 'user_makima_watch',
    username: 'MakimaArchive',
    display_name: 'Makima',
    avatar_preset: 'psych_master',
    avatar_frame_color: 'amber',
    role: 'user',
    bio: 'Devoted to psychological masterworks and suspense cinema.',
    shelfCount: 210,
    levelTitle: 'Otaku Connoisseur'
  },
  {
    id: 'user_violet_ever',
    username: 'VioletMemories',
    display_name: 'Violet',
    avatar_preset: 'sakura_blade',
    avatar_frame_color: 'violet',
    role: 'user',
    bio: 'Auto Memory Doll writing heartfelt letters and reading light novels.',
    shelfCount: 98,
    levelTitle: 'Shelf Collector'
  }
];

export function getAdminList(): string[] {
  try {
    const raw = localStorage.getItem('kuro_admin_registry');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const set = new Set(['kuro', ...parsed.map((s: string) => s.toLowerCase().trim())]);
        return Array.from(set);
      }
    }
  } catch (e) {}
  return ['kuro'];
}

export function promoteToAdmin(targetUsername: string): boolean {
  const clean = targetUsername.toLowerCase().trim().replace(/^@/, '');
  if (!clean) return false;

  const current = getAdminList();
  if (!current.includes(clean)) {
    current.push(clean);
    try {
      localStorage.setItem('kuro_admin_registry', JSON.stringify(current));
    } catch (e) {}
  }

  // Also update active session if current user matches
  try {
    const local = localStorage.getItem('kuro_local_user');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.username && parsed.username.toLowerCase() === clean) {
        parsed.role = 'admin';
        localStorage.setItem('kuro_local_user', JSON.stringify(parsed));
      }
    }
  } catch (e) {}

  // Dispatch event for instant UI reactivity across tabs and components
  try {
    window.dispatchEvent(new CustomEvent('kuro_admin_updated', { detail: { username: clean, role: 'admin' } }));
  } catch (e) {}

  return true;
}

export function demoteFromAdmin(targetUsername: string): boolean {
  const clean = targetUsername.toLowerCase().trim().replace(/^@/, '');
  if (!clean || clean === 'kuro') return false; // Sovereign admin @Kuro cannot be demoted

  const current = getAdminList().filter((u) => u !== clean);
  try {
    localStorage.setItem('kuro_admin_registry', JSON.stringify(current));
  } catch (e) {}

  try {
    const local = localStorage.getItem('kuro_local_user');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.username && parsed.username.toLowerCase() === clean) {
        parsed.role = 'user';
        localStorage.setItem('kuro_local_user', JSON.stringify(parsed));
      }
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('kuro_admin_updated', { detail: { username: clean, role: 'user' } }));
  } catch (e) {}

  return true;
}

export function getStoredFollowData(userId?: string): { following: string[]; followers: string[] } {
  const key = `kuro_shelf_social_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Filter out any legacy mock followers so the user's profile is completely authentic
      const cleanFollowing = Array.isArray(parsed.following)
        ? parsed.following.filter((id: string) => id !== 'user_kuro_admin')
        : [];
      const cleanFollowers = Array.isArray(parsed.followers)
        ? parsed.followers.filter((id: string) => id !== 'user_spike_99' && id !== 'user_makima_watch')
        : [];
      return { following: cleanFollowing, followers: cleanFollowers };
    }
  } catch (e) {}
  // Real followers: Always start at 0 (empty) for genuine accounts
  return {
    following: [],
    followers: []
  };
}

export function saveStoredFollowData(userId: string | undefined, data: { following: string[]; followers: string[] }): void {
  const key = `kuro_shelf_social_${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

export function isAdminUser(user: { username?: string | null; role?: string } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.username) {
    const u = user.username.trim().toLowerCase();
    if (u === 'kuro') return true;
    if (getAdminList().includes(u)) return true;
  }
  return false;
}

export function validateUsername(
  candidateUsername: string,
  currentUser?: { role?: string; username?: string } | null
): { valid: boolean; error?: string; isAdminGrant?: boolean } {
  const clean = candidateUsername.trim().toLowerCase();

  if (!clean) {
    return { valid: false, error: 'Username cannot be empty.' };
  }

  if (!/^[a-zA-Z0-9_.]+$/.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and dots.' };
  }

  // Account "@Kuro" or accounts in Admin Registry
  if (clean === 'kuro' || getAdminList().includes(clean)) {
    return { valid: true, isAdminGrant: true };
  }

  // Short usernames of 4 characters or fewer are reserved for admins
  const isAlreadyAdmin = isAdminUser(currentUser);
  if (clean.length <= 4 && !isAlreadyAdmin) {
    return {
      valid: false,
      error: 'Usernames of 4 characters or fewer are reserved exclusively for Kuro Shelf Administrators. Regular members must choose a username with at least 5 characters.'
    };
  }

  if (clean.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or fewer.' };
  }

  return { valid: true };
}

export function getStoredProfileCustomization(userId?: string): UserProfileCustomization {
  const key = `kuro_shelf_profile_custom_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Profile] Failed to load local profile preferences:', err);
  }

  // Sensible empty default - no boxes pre-filled as requested
  return {
    avatar_preset: 'ronin',
    avatar_frame_color: 'rose',
    banner_preset: 'cyberpunk',
    status_message: '',
    bio: '',
    favorite_quote: '',
    gender: '',
    favorite_genres: [],
    pinned_shelf_ids: [],
    social_discord: '',
    social_anilist: '',
    social_mal: '',
    title_language_preference: 'romaji',
    spoiler_blur_enabled: true
  };
}

export function saveStoredProfileCustomization(
  customization: UserProfileCustomization,
  userId?: string
): void {
  const key = `kuro_shelf_profile_custom_${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(customization));
  } catch (err) {
    console.warn('[Profile] Failed to save local profile preferences:', err);
  }
}

export function calculateOtakuRank(shelf: ShelfEntry[], activities: UserActivity[]) {
  const shelfCount = shelf.length;
  const completedCount = shelf.filter((s) => s.status === 'completed').length;
  const watchingCount = shelf.filter((s) => s.status === 'watching').length;
  const ratedCount = shelf.filter((s) => (s.userRating || 0) > 0).length;
  const activitiesCount = activities.length;

  // XP formula based on actual user tracking actions
  const totalXp = shelfCount * 25 + completedCount * 50 + watchingCount * 15 + ratedCount * 20 + activitiesCount * 10;
  const level = Math.max(1, Math.floor(totalXp / 100) + 1);
  const currentLevelBaseXp = (level - 1) * 100;
  const nextLevelBaseXp = level * 100;
  const currentProgressXp = totalXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.round((currentProgressXp / (nextLevelBaseXp - currentLevelBaseXp)) * 100));

  let title = 'Wandering Watcher';
  let titleBadgeColor = 'text-neutral-400 bg-neutral-800/80 border-neutral-700';

  if (level >= 30) {
    title = 'Grandmaster Curator';
    titleBadgeColor = 'text-amber-300 bg-amber-950/60 border-amber-500/50';
  } else if (level >= 20) {
    title = 'Otaku Connoisseur';
    titleBadgeColor = 'text-purple-300 bg-purple-950/60 border-purple-500/50';
  } else if (level >= 12) {
    title = 'Seasoned Marathoner';
    titleBadgeColor = 'text-rose-300 bg-rose-950/60 border-rose-500/50';
  } else if (level >= 6) {
    title = 'Shelf Collector';
    titleBadgeColor = 'text-cyan-300 bg-cyan-950/60 border-cyan-500/50';
  } else if (level >= 3) {
    title = 'Apprentice Otaku';
    titleBadgeColor = 'text-emerald-300 bg-emerald-950/60 border-emerald-500/50';
  }

  return {
    level,
    title,
    titleBadgeColor,
    totalXp,
    currentProgressXp,
    progressPercent,
    xpToNext: 100 - currentProgressXp
  };
}

export function computeUserBadges(shelf: ShelfEntry[], userCustom: UserProfileCustomization): OtakuBadge[] {
  const shelfCount = shelf.length;
  const completedCount = shelf.filter((s) => s.status === 'completed').length;
  const watchingCount = shelf.filter((s) => s.status === 'watching').length;
  const mangaCount = shelf.filter((s) => s.mediaType === 'manga').length;
  const ratedCount = shelf.filter((s) => (s.userRating || 0) > 0).length;
  const masterworkCount = shelf.filter((s) => s.userRating === 10).length;
  const planCount = shelf.filter((s) => s.status === 'plan_to_watch').length;

  return [
    {
      id: 'pioneer',
      title: 'First Step',
      description: 'Added your first title to Kuro Shelf',
      icon: '🌱',
      unlocked: shelfCount >= 1,
      color: 'emerald'
    },
    {
      id: 'collector',
      title: 'Avid Collector',
      description: 'Added 5 or more titles to your personal shelf',
      icon: '📚',
      unlocked: shelfCount >= 5,
      color: 'cyan'
    },
    {
      id: 'marathon',
      title: 'Marathon Finisher',
      description: 'Completed 3 full anime series or manga volumes',
      icon: '🏆',
      unlocked: completedCount >= 3,
      color: 'amber'
    },
    {
      id: 'active_stream',
      title: 'Current Season Watcher',
      description: 'Actively watching 2 or more series simultaneously',
      icon: '📺',
      unlocked: watchingCount >= 2,
      color: 'rose'
    },
    {
      id: 'manga_reader',
      title: 'Manga Connoisseur',
      description: 'Expanded library with published manga titles',
      icon: '📖',
      unlocked: mangaCount >= 1,
      color: 'purple'
    },
    {
      id: 'critic',
      title: 'Honest Critic',
      description: 'Rated 3 or more titles with your personal score',
      icon: '⭐',
      unlocked: ratedCount >= 3,
      color: 'yellow'
    },
    {
      id: 'masterwork',
      title: 'Masterwork Discovery',
      description: 'Awarded a 10/10 masterpiece score',
      icon: '💎',
      unlocked: masterworkCount >= 1,
      color: 'sky'
    },
    {
      id: 'visionary',
      title: 'Future Watchlist',
      description: 'Saved 3 or more titles in Plan to Watch',
      icon: '🔮',
      unlocked: planCount >= 3,
      color: 'indigo'
    },
    {
      id: 'identity',
      title: 'Personalized Identity',
      description: 'Configured custom bio, avatar, or banner theme',
      icon: '🎨',
      unlocked: Boolean(userCustom.avatar_preset || userCustom.avatar_url || userCustom.bio),
      color: 'pink'
    }
  ];
}
