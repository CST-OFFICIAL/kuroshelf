import { UserProfileCustomization, OtakuBadge, ShelfEntry, UserActivity } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  category: string;
  badge: string;
  bgColor: string;
  svgIcon: string;
  isAdminOnly?: boolean;
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
  // 1. Silly & Fun Community Avatars (User Requested)
  {
    id: 'silly_derp_cat',
    name: 'Derp Neko',
    category: 'Silly & Fun',
    badge: 'Blep',
    bgColor: 'from-amber-400 to-rose-400',
    svgIcon: '🐱'
  },
  {
    id: 'silly_confused_duck',
    name: 'Confused Duck',
    category: 'Silly & Fun',
    badge: 'Quack?',
    bgColor: 'from-yellow-400 to-amber-500',
    svgIcon: '🦆'
  },
  {
    id: 'silly_toast_runner',
    name: 'Late For School',
    category: 'Silly & Fun',
    badge: 'Panic!',
    bgColor: 'from-sky-400 to-indigo-500',
    svgIcon: '🍞'
  },
  {
    id: 'silly_smug_hamster',
    name: 'Smug Hamster',
    category: 'Silly & Fun',
    badge: 'Smug',
    bgColor: 'from-orange-400 to-amber-600',
    svgIcon: '🐹'
  },
  {
    id: 'silly_blob_shrug',
    name: 'Shrugging Blob',
    category: 'Silly & Fun',
    badge: '¯\\_(ツ)_/¯',
    bgColor: 'from-teal-400 to-emerald-600',
    svgIcon: '🫧'
  },
  {
    id: 'silly_popcat',
    name: 'Pop Cat',
    category: 'Silly & Fun',
    badge: 'Pop!',
    bgColor: 'from-rose-400 to-red-500',
    svgIcon: '😺'
  },
  {
    id: 'silly_capybara',
    name: 'Zen Capybara',
    category: 'Silly & Fun',
    badge: 'Unbothered',
    bgColor: 'from-amber-500 to-stone-700',
    svgIcon: '🍊'
  },
  {
    id: 'silly_boba_ghost',
    name: 'Boba Ghost',
    category: 'Silly & Fun',
    badge: 'Nom',
    bgColor: 'from-purple-400 to-indigo-600',
    svgIcon: '👻'
  },

  // 2. Clean Aesthetic & Minimalist Avatars (100% Original, Zero Copyright Risk)
  {
    id: 'noir_samurai',
    name: 'Noir Ronin',
    category: 'Aesthetic Noir',
    badge: 'Blade',
    bgColor: 'from-neutral-800 to-black',
    svgIcon: '⚔️'
  },
  {
    id: 'cyber_agent',
    name: 'Cyber Visor',
    category: 'Cyberpunk',
    badge: 'Visor',
    bgColor: 'from-cyan-500 to-slate-900',
    svgIcon: '🕶️'
  },
  {
    id: 'kitsune_mask',
    name: 'Spirit Kitsune',
    category: 'Traditional',
    badge: 'Mask',
    bgColor: 'from-rose-500 to-neutral-900',
    svgIcon: '🎭'
  },
  {
    id: 'minimal_lunar',
    name: 'Eclipse Crescent',
    category: 'Atmospheric',
    badge: 'Lunar',
    bgColor: 'from-blue-600 to-slate-950',
    svgIcon: '🌙'
  },

  // 3. Exactly 5 Sovereign Avatars (Admin Exclusive - Mature & High-End)
  {
    id: 'kuro_dragon_emperor',
    name: 'Kuro-Ryu Sovereign',
    category: 'Sovereign (Exclusive)',
    badge: 'Dragon Crown',
    bgColor: 'from-amber-500 via-rose-950 to-black',
    svgIcon: '🐉',
    isAdminOnly: true
  },
  {
    id: 'shadow_monarch',
    name: 'Shadow Monarch (Arise)',
    category: 'Sovereign (Exclusive)',
    badge: 'Necrotic King',
    bgColor: 'from-violet-600 via-purple-950 to-black',
    svgIcon: '👑',
    isAdminOnly: true
  },
  {
    id: 'six_eyes',
    name: 'Limitless Awakened (Gojo)',
    category: 'Sovereign (Exclusive)',
    badge: 'Infinity',
    bgColor: 'from-sky-400 via-blue-950 to-slate-950',
    svgIcon: '👁️',
    isAdminOnly: true
  },
  {
    id: 'sun_god_liberation',
    name: 'Blood Moon Ronin',
    category: 'Sovereign (Exclusive)',
    badge: 'Crimson Edge',
    bgColor: 'from-red-600 via-rose-950 to-black',
    svgIcon: '⚔️',
    isAdminOnly: true
  },
  {
    id: 'susanoo_god',
    name: 'Celestial Susanoo Tengu',
    category: 'Sovereign (Exclusive)',
    badge: 'Chakra Armor',
    bgColor: 'from-fuchsia-600 via-indigo-950 to-black',
    svgIcon: '🛡️',
    isAdminOnly: true
  }
];

export const BANNER_THEMES: BannerTheme[] = [
  // Mature, Sleek Atmospheric Banners (Available to all users)
  {
    id: 'midnight_obsidian',
    name: 'Midnight Obsidian',
    tagline: 'Matte obsidian & dark charcoal with subtle luxury micro-grid',
    gradient: 'from-[#0a0a0c] via-[#131418] to-[#1c1d22]',
    accentColor: '#94a3b8',
    pattern: 'grid'
  },
  {
    id: 'tokyo_rain',
    name: 'Tokyo Rain: Neon Noir',
    tagline: 'Cinematic wet asphalt with moody teal and violet city light reflections',
    gradient: 'from-[#050b14] via-[#0d1b2a] to-[#1b263b]',
    accentColor: '#38bdf8',
    pattern: 'waves'
  },
  {
    id: 'abyssal_navy',
    name: 'Abyssal Navy',
    tagline: 'Deep oceanic indigo with starry horizon stardust',
    gradient: 'from-[#030712] via-[#0f172a] to-[#1e1b4b]',
    accentColor: '#6366f1',
    pattern: 'radial'
  },
  {
    id: 'velvet_burgundy',
    name: 'Velvet Burgundy',
    tagline: 'Rich smoked wine & garnet shadows for a refined dark aesthetic',
    gradient: 'from-[#1a050d] via-[#2a0815] to-[#16040b]',
    accentColor: '#f43f5e',
    pattern: 'lines'
  },
  {
    id: 'smoked_sage',
    name: 'Smoked Sage & Emerald',
    tagline: 'Subtle dark forest moss and misty bamboo mountain ridge',
    gradient: 'from-[#05130e] via-[#0c241b] to-[#040e0a]',
    accentColor: '#10b981',
    pattern: 'waves'
  },
  {
    id: 'solar_eclipse',
    name: 'Solar Umbra',
    tagline: 'Dark lunar eclipse with a radiant amber corona on the horizon',
    gradient: 'from-[#140b02] via-[#241505] to-[#0d0701]',
    accentColor: '#f59e0b',
    pattern: 'radial'
  },
  {
    id: 'vapor_charcoal',
    name: 'Brushed Titanium',
    tagline: 'Minimalist industrial graphite & satin steel sheen',
    gradient: 'from-[#111315] via-[#1c2024] to-[#121416]',
    accentColor: '#cbd5e1',
    pattern: 'dots'
  },
  {
    id: 'amethyst_dusk',
    name: 'Amethyst Dusk',
    tagline: 'Moody deep plum and dusky violet twilight gradient',
    gradient: 'from-[#12051e] via-[#230b3a] to-[#0f0419]',
    accentColor: '#a855f7',
    pattern: 'waves'
  },

  // Exactly 5 Exclusive Admin Banners (Mature, Dark Aesthetic with Frame Breakout)
  {
    id: 'kuro_sovereign',
    name: 'Kuro-Ryu: Sumi-e Sovereign Dragon',
    tagline: 'Sacred ink-wash cosmic dragon horns and whiskers breaking out of the banner frame (黒竜皇室)',
    gradient: 'from-[#050103] via-[#1a040b] to-[#0a0104]',
    accentColor: '#f43f5e',
    pattern: 'singularity',
    isAdminOnly: true,
    visualEffect: 'singularity'
  },
  {
    id: 'shadow_monarch',
    name: 'Shadow Monarch: Abyssal Arise',
    tagline: 'Obsidian throne spires, scarlet knight plume, and necrotic shadow wisps surging out of frame (影の君主)',
    gradient: 'from-[#05000f] via-[#120326] to-[#060012]',
    accentColor: '#a855f7',
    pattern: 'aurora',
    isAdminOnly: true,
    visualEffect: 'aurora'
  },
  {
    id: 'domain_expansion',
    name: 'Domain Expansion: Limitless Void',
    tagline: 'Dimensional fracture glass and sacred hand mudra seal piercing past the frame borders (無量空処)',
    gradient: 'from-[#01040f] via-[#071329] to-[#01030a]',
    accentColor: '#38bdf8',
    pattern: 'singularity',
    isAdminOnly: true,
    visualEffect: 'singularity'
  },
  {
    id: 'bankai_flame',
    name: 'Blood Moon: Zanka no Tachi',
    tagline: 'Colossal scorched katana blade and incandescent solar embers slicing over the top banner edge (残火の太刀)',
    gradient: 'from-[#120202] via-[#260505] to-[#0a0000]',
    accentColor: '#f97316',
    pattern: 'corona',
    isAdminOnly: true,
    visualEffect: 'corona'
  },
  {
    id: 'susanoo_citadel',
    name: 'Perfect Susanoo: Celestial Tengu',
    tagline: 'Ethereal winged chakra armor and horned Tengu helmet crest towering over the banner frame (須佐能乎)',
    gradient: 'from-[#0a0217] via-[#190633] to-[#080112]',
    accentColor: '#c084fc',
    pattern: 'aurora',
    isAdminOnly: true,
    visualEffect: 'aurora'
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
    avatar_preset: 'silly_derp_cat',
    avatar_frame_color: 'none',
    banner_preset: 'midnight_obsidian',
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
