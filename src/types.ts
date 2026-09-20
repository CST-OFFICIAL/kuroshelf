export interface JikanImageFormats {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface JikanImages {
  jpg: JikanImageFormats;
  webp?: JikanImageFormats;
}

export interface JikanGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanStudio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanBroadcast {
  day?: string;
  time?: string;
  timezone?: string;
  string?: string;
}

export interface JikanTrailer {
  youtube_id?: string;
  url?: string;
  embed_url?: string;
}

export interface AnimeItem {
  mal_id: number;
  url: string;
  images: JikanImages;
  trailer?: JikanTrailer;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type?: string;
  source?: string;
  episodes?: number;
  status?: string;
  airing: boolean;
  aired?: {
    from?: string;
    to?: string;
    string?: string;
  };
  duration?: string;
  rating?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  season?: string;
  year?: number;
  broadcast?: JikanBroadcast;
  studios?: JikanStudio[];
  genres?: JikanGenre[];
  themes?: JikanGenre[];
  demographics?: JikanGenre[];
  relations?: {
    relation: string;
    entry: {
      mal_id: number;
      type: string;
      name: string;
      url: string;
    }[];
  }[];
  streaming?: { name: string; url: string }[];
  external?: { name: string; url: string }[];
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items?: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface AuthUser {
  profile_setup_complete?: boolean;
  id: string;
  email: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: 'admin' | 'user';
  created_at: string;
}

export interface UserProfileCustomization {
  avatar_url?: string;
  avatar_preset?: string;
  avatar_frame_color?:
    | 'none'
    | 'simple_blurple'
    | 'simple_emerald'
    | 'simple_ruby'
    | 'simple_amber'
    | 'simple_fuchsia'
    | 'simple_cyan'
    | 'dragon_gold'
    | 'shadow_arise'
    | 'infinity_void'
    | 'sun_god_flame'
    | 'susanoo_chakra'
    | 'rose'
    | 'cyan'
    | 'amber'
    | 'violet'
    | 'emerald'
    | 'astral_sovereign'
    | 'void_singularity';
  banner_preset?: string;
  banner_custom_url?: string;
  status_message?: string;
  bio?: string;
  favorite_quote?: string;
  gender?: 'Male' | 'Female' | 'Non-binary' | 'Rather not say' | 'Others' | '';
  favorite_genres?: string[];
  pinned_shelf_ids?: number[];
  social_discord?: string;
  social_anilist?: string;
  social_mal?: string;
  title_language_preference?: 'romaji' | 'english' | 'japanese';
  spoiler_blur_enabled?: boolean;
}

export interface OtakuBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

export interface MangaItem {
  mal_id: number;
  url: string;
  images: JikanImages;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type?: string;
  chapters?: number;
  volumes?: number;
  status?: string;
  publishing: boolean;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  synopsis?: string;
  genres?: JikanGenre[];
  authors?: { mal_id: number; name: string; type: string }[];
}

export interface CharacterItem {
  character: {
    mal_id: number;
    url: string;
    images: JikanImages;
    name: string;
  };
  role: string;
  voice_actors?: {
    person: {
      mal_id: number;
      url?: string;
      images?: JikanImages;
      name: string;
    };
    language: string;
  }[];
}

export type ShelfStatus = 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped';

export interface ShelfEntry {
  id: number;
  mediaType: 'anime' | 'manga';
  title: string;
  image: string;
  status: ShelfStatus;
  userRating?: number; // 1 to 10
  isLiked: boolean;
  progress: number;
  totalUnits?: number;
  notes?: string;
  updatedAt: number;
}

export interface UserActivity {
  id: string;
  mediaId: number;
  title: string;
  mediaType: 'anime' | 'manga';
  action: 'added' | 'status_changed' | 'rated' | 'liked' | 'progress_updated';
  details: string;
  timestamp: number;
}

export interface PredictionPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PredictionPoll {
  id: string;
  animeTitle?: string;
  animeId?: number;
  question: string;
  options: PredictionPollOption[];
  totalVotes: number;
  status: 'active' | 'closed';
  endsAt: string; // ISO date string
}

export interface WatchPlatform {
  name: string;
  url: string;
  region: string;
  type: 'Subscription' | 'Free with Ads' | 'Purchase' | 'Platform Search';
  isOfficialSearchDirectory?: boolean;
  directTitleAvailable?: boolean;
  lastVerified?: string;
}

export type BaseJikanAnime = AnimeItem;

export interface AiringScheduleItem extends AnimeItem {
  airing_schedule?: {
    episode: number;
    airing_at: number;
    time_until_airing: number;
    airing_day: string;
    airing_time: string;
  };
}

export interface RecommendedAnimeItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  image_url: string;
  score?: number | null;
  votes?: number;
  format?: string;
  genres?: string[];
}

export interface CharacterDetail {
  mal_id: number;
  name: string;
  name_kanji?: string | null;
  nicknames?: string[];
  about?: string | null;
  favorites?: number;
  image_url: string;
  anime: {
    mal_id: number;
    title: string;
    image_url: string;
    role?: string;
    score?: number | null;
  }[];
  voices?: {
    person_id: number;
    name: string;
    language: string;
    image_url: string;
  }[];
}

export interface PersonDetail {
  mal_id: number;
  name: string;
  family_name?: string | null;
  given_name?: string | null;
  birthday?: string | null;
  about?: string | null;
  favorites?: number;
  image_url: string;
  occupations?: string[];
  roles: {
    character_id: number;
    character_name: string;
    character_image: string;
    role?: string;
    anime_id: number;
    anime_title: string;
    anime_image: string;
  }[];
}

export interface ShelfExportData {
  version: string;
  exportDate: string;
  appName: string;
  entries: ShelfEntry[];
  stats?: {
    totalEntries: number;
    animeCount: number;
    mangaCount: number;
  };
}

export interface DailyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  checkedInToday: boolean;
  streakHistory: string[]; // Recent check-in dates (YYYY-MM-DD)
  freezeAvailable: boolean; // 1 free freeze shield
  totalCheckIns: number;
}

export interface StreakMilestone {
  days: number;
  title: string;
  badge: string;
  description: string;
  unlocked: boolean;
}

export interface SavedAccount {
  user: AuthUser;
  token?: string | null;
  lastActiveAt: number;
  customization?: UserProfileCustomization;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ViewDistance = '100%' | '90%' | '85%' | '75%' | '67%' | 'far' | 'standard';


