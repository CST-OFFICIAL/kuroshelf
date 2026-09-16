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
  created_at: string;
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
