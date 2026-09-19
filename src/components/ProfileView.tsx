import { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Bookmark,
  BarChart3,
  Calendar,
  Vote,
  BookOpen,
  ChevronRight,
  Check,
  Palette,
  Settings,
  Trophy,
  Sliders,
  Share2,
  Camera,
  Pin,
  Sparkles,
  Star,
  User as UserIcon,
  Users,
  UserCheck,
  UserPlus,
  Crown,
  X,
  Flame,
  Search
} from 'lucide-react';
import { AuthUser, ShelfEntry, UserActivity, UserProfileCustomization } from '../types';
import { updateProfileSetup, logoutUser } from '../services/authService';
import {
  AVATAR_PRESETS,
  BANNER_THEMES,
  AVAILABLE_GENRES,
  INITIAL_COMMUNITY_USERS,
  getStoredProfileCustomization,
  saveStoredProfileCustomization,
  getStoredFollowData,
  saveStoredFollowData,
  calculateOtakuRank,
  computeUserBadges,
  isAdminUser,
  validateUsername,
  getAdminList,
  promoteToAdmin,
  demoteFromAdmin
} from '../services/profileCustomizationService';
import { AnimeAvatar } from './AnimeAvatar';
import { AdminDragonBanner } from './AdminDragonBanner';
import { NormalBannerArt } from './NormalBannerArt';

interface ProfileViewProps {
  currentUser: AuthUser | null;
  onProfileUpdated: (user: AuthUser) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenStats?: () => void;
  onOpenImportExport?: () => void;
  onOpenAuth?: () => void;
  shelf?: ShelfEntry[];
  activities?: UserActivity[];
  onSelectAnime?: (anime: any) => void;
  onSelectManga?: (title: string) => void;
  shelfCount?: number;
}

export function ProfileView({
  currentUser,
  onProfileUpdated,
  onNavigateTab,
  onOpenStats,
  onOpenImportExport,
  onOpenAuth,
  shelf = [],
  activities = [],
  onSelectAnime,
  onSelectManga,
  shelfCount: _shelfCount = 0
}: ProfileViewProps) {
  // Active inner profile tab
  const [activeProfileTab, setActiveProfileTab] = useState<'showcase' | 'edit' | 'preferences' | 'admin_console'>('showcase');

  // Stored custom preferences
  const [customization, setCustomization] = useState(() =>
    getStoredProfileCustomization(currentUser?.id)
  );

  // Admin status check
  const isAdmin = useMemo(() => isAdminUser(currentUser), [currentUser]);

  // Admin Console States
  const [adminRoster, setAdminRoster] = useState<string[]>(() => getAdminList());
  const [promoteTargetInput, setPromoteTargetInput] = useState('');
  const [adminActionNotice, setAdminActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState(currentUser?.display_name || currentUser?.username || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [gender, setGender] = useState<string>(customization.gender || '');
  const [selectedPresetId, setSelectedPresetId] = useState(customization.avatar_preset || 'ronin');
  const [frameColor, setFrameColor] = useState(customization.avatar_frame_color || 'rose');
  const [selectedBannerId, setSelectedBannerId] = useState(customization.banner_preset || 'cyberpunk');
  const [statusMessage, setStatusMessage] = useState(customization.status_message || '');
  const [bio, setBio] = useState(customization.bio || '');
  const [favoriteQuote, setFavoriteQuote] = useState(customization.favorite_quote || '');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(customization.favorite_genres || []);
  const [socialDiscord, setSocialDiscord] = useState(customization.social_discord || '');
  const [socialAnilist, setSocialAnilist] = useState(customization.social_anilist || '');
  const [socialMal, setSocialMal] = useState(customization.social_mal || '');
  const [titleLanguage, setTitleLanguage] = useState<'romaji' | 'english' | 'japanese'>(
    customization.title_language_preference || 'romaji'
  );
  const [spoilerBlur, setSpoilerBlur] = useState<boolean>(
    customization.spoiler_blur_enabled !== false
  );
  const [pinnedShelfIds, setPinnedShelfIds] = useState<number[]>(
    customization.pinned_shelf_ids || []
  );

  // Social states (Following & Followers)
  const [followData, setFollowData] = useState(() => getStoredFollowData(currentUser?.id));
  const [socialModalOpen, setSocialModalOpen] = useState<'followers' | 'following' | null>(null);

  // Pin selector modal
  const [pinSelectorOpen, setPinSelectorOpen] = useState(false);

  // Async submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.display_name || currentUser.username || '');
      setUsername(currentUser.username || '');
      const loaded = getStoredProfileCustomization(currentUser.id);
      setCustomization(loaded);
      setSelectedPresetId(loaded.avatar_preset || 'ronin');
      setFrameColor(loaded.avatar_frame_color || 'rose');
      setSelectedBannerId(loaded.banner_preset || 'cyberpunk');
      setStatusMessage(loaded.status_message || '');
      setBio(loaded.bio || '');
      setFavoriteQuote(loaded.favorite_quote || '');
      setGender(loaded.gender || '');
      setFavoriteGenres(loaded.favorite_genres || []);
      setPinnedShelfIds(loaded.pinned_shelf_ids || []);
      setSocialDiscord(loaded.social_discord || '');
      setSocialAnilist(loaded.social_anilist || '');
      setSocialMal(loaded.social_mal || '');
      setTitleLanguage(loaded.title_language_preference || 'romaji');
      setSpoilerBlur(loaded.spoiler_blur_enabled !== false);
      setFollowData(getStoredFollowData(currentUser.id));
    }
  }, [currentUser]);

  // Success auto-dismiss
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (success) {
      timeout = setTimeout(() => setSuccess(false), 3500);
    }
    return () => clearTimeout(timeout);
  }, [success]);

  // Derived rank and badges
  const rank = useMemo(() => calculateOtakuRank(shelf, activities), [shelf, activities]);
  const badges = useMemo(() => computeUserBadges(shelf, customization), [shelf, customization]);

  // Shelf quick breakdown
  const shelfStats = useMemo(() => {
    const total = shelf.length;
    const watching = shelf.filter((s) => s.status === 'watching').length;
    const completed = shelf.filter((s) => s.status === 'completed').length;
    const plan = shelf.filter((s) => s.status === 'plan_to_watch').length;
    const onHold = shelf.filter((s) => s.status === 'on_hold').length;
    const dropped = shelf.filter((s) => s.status === 'dropped').length;
    const animeCount = shelf.filter((s) => s.mediaType === 'anime').length;
    const mangaCount = shelf.filter((s) => s.mediaType === 'manga').length;

    const ratedItems = shelf.filter((s) => (s.userRating || 0) > 0);
    const meanRating = ratedItems.length > 0
      ? (ratedItems.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedItems.length).toFixed(1)
      : 'N/A';

    return { total, watching, completed, plan, onHold, dropped, animeCount, mangaCount, meanRating };
  }, [shelf]);

  // Filtered available banners (admins see exclusive ones; normal users do not)
  const availableBanners = useMemo(() => {
    return BANNER_THEMES.filter((theme) => !theme.isAdminOnly || isAdmin);
  }, [isAdmin]);

  // Selected banner theme details (strictly filtered so normal users cannot render admin banners)
  const activeBannerTheme = useMemo(
    () => availableBanners.find((b) => b.id === selectedBannerId) || availableBanners[0] || BANNER_THEMES[0],
    [availableBanners, selectedBannerId]
  );

  // Selected avatar preset
  const activeAvatarPreset = useMemo(
    () => AVATAR_PRESETS.find((p) => p.id === selectedPresetId) || AVATAR_PRESETS[0],
    [selectedPresetId]
  );

  // Frame colors
  const frameBorderClass = useMemo(() => {
    switch (frameColor) {
      case 'cyan':
        return 'border-cyan-400 shadow-cyan-500/30';
      case 'amber':
        return 'border-amber-400 shadow-amber-500/30';
      case 'violet':
        return 'border-purple-400 shadow-purple-500/30';
      case 'emerald':
        return 'border-emerald-400 shadow-emerald-500/30';
      case 'rose':
      default:
        return 'border-rose-500 shadow-rose-500/30';
    }
  }, [frameColor]);

  // Pinned items from actual shelf
  const pinnedItems = useMemo(() => {
    if (!pinnedShelfIds || pinnedShelfIds.length === 0) {
      return shelf.slice(0, 4);
    }
    return pinnedShelfIds
      .map((id) => shelf.find((s) => s.id === id))
      .filter((item): item is ShelfEntry => Boolean(item));
  }, [shelf, pinnedShelfIds]);

  const handleCopyProfileCard = () => {
    const text = `Kuro Shelf Profile: @${username || 'otaku'} (${rank.title} • Lv.${rank.level}) | ${shelfStats.total} shelf titles tracked.`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleGenre = (genre: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleTogglePin = (shelfId: number) => {
    setPinnedShelfIds((prev) => {
      if (prev.includes(shelfId)) {
        return prev.filter((id) => id !== shelfId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), shelfId];
      }
      return [...prev, shelfId];
    });
  };

  const handleToggleFollow = (targetId: string) => {
    setFollowData((prev) => {
      const isFollowing = prev.following.includes(targetId);
      const nextFollowing = isFollowing
        ? prev.following.filter((id) => id !== targetId)
        : [...prev.following, targetId];
      const nextData = { ...prev, following: nextFollowing };
      saveStoredFollowData(currentUser?.id, nextData);
      return nextData;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim() || displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError('Display name must be between 2 and 50 characters.');
      return;
    }

    // Validate username with admin-exclusive 4-character rule
    const validation = validateUsername(username, currentUser);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username.');
      return;
    }

    setLoading(true);

    try {
      if (currentUser) {
        const res = await updateProfileSetup(
          username.trim(),
          displayName.trim(),
          undefined,
          undefined
        );

        if (!res.success) {
          setError(res.error || 'Failed to update profile identity.');
          setLoading(false);
          return;
        }
      }

      // Save local aesthetic customization
      const updatedCustom: UserProfileCustomization = {
        avatar_preset: selectedPresetId,
        avatar_frame_color: frameColor,
        banner_preset: selectedBannerId,
        status_message: statusMessage.trim(),
        bio: bio.trim(),
        favorite_quote: favoriteQuote.trim(),
        gender: (gender.trim() || undefined) as any,
        favorite_genres: favoriteGenres,
        pinned_shelf_ids: pinnedShelfIds,
        social_discord: socialDiscord.trim(),
        social_anilist: socialAnilist.trim(),
        social_mal: socialMal.trim(),
        title_language_preference: titleLanguage,
        spoiler_blur_enabled: spoilerBlur
      };

      setCustomization(updatedCustom);
      saveStoredProfileCustomization(updatedCustom, currentUser?.id);

      if (currentUser) {
        const isNowAdmin = validation.isAdminGrant || username.trim().toLowerCase() === 'kuro' || isAdmin;
        onProfileUpdated({
          ...currentUser,
          username: username.trim(),
          display_name: displayName.trim(),
          role: isNowAdmin ? 'admin' : (currentUser.role || 'user'),
          profile_setup_complete: true
        });
      }

      setSuccess(true);
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Guest State Banner (If user is not logged in)
  if (!currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-8 sm:p-12 text-center shadow-2xl">
          {/* Decorative backdrop */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-rose-950/50 border-2 border-white/20">
              黒
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                Unlock Your Kuro Shelf Passport
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base mt-2 leading-relaxed">
                Join Kuro Shelf to get your personal anime & manga identity, unlock Otaku Levels, earn milestone badges, and sync your private watchlist across all your devices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 w-fit mb-2">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Private Cloud Shelf</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Track watching, completed, and plan-to-watch titles securely.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 w-fit mb-2">
                  <Trophy className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Otaku Level & Badges</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Earn ranks, unlock avatar presets, and showcase masterworks.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 w-fit mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Strict Row-Level Security</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Your private notes and ratings stay private to your account.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-rose-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In or Create Account</span>
              </button>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('home')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium text-sm transition-colors cursor-pointer"
                >
                  Explore Catalog
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* 1. HERO PROFILE CARD */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-900/90 border border-neutral-800 shadow-2xl">
        {/* Banner Artwork Backdrop with Popping Dragon & Normal Art */}
        <div className={`relative h-44 sm:h-60 w-full overflow-visible bg-gradient-to-r ${activeBannerTheme.gradient}`}>
          {/* If Exclusive Admin Banner: Japanese Dragon bursting out */}
          {activeBannerTheme.isAdminOnly ? (
            <AdminDragonBanner themeId={activeBannerTheme.id} />
          ) : (
            <NormalBannerArt themeId={activeBannerTheme.id} />
          )}

          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none" />

          {/* Quick Banner Switcher button */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveProfileTab('edit')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
              title="Customize banner & theme"
            >
              <Palette className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Theme:</span>
              <span className="text-rose-300">{activeBannerTheme.name}</span>
            </button>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="relative px-6 sm:px-8 pb-6 sm:pb-8 -mt-16 sm:-mt-20 z-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Anime Avatar with Exclusive Frame & Edit overlay */}
              <div className="relative group">
                <AnimeAvatar
                  presetId={selectedPresetId}
                  frameColor={frameColor}
                  size="2xl"
                  isAdmin={isAdmin}
                />

                {/* Edit overlay on avatar */}
                <button
                  type="button"
                  onClick={() => setActiveProfileTab('edit')}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity z-20 cursor-pointer backdrop-blur-xs"
                >
                  <Camera className="w-5 h-5 mb-1 text-rose-400" />
                  <span>Change</span>
                </button>

                {/* Online indicator */}
                <span
                  className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-900 z-20 shadow-md"
                  title="Active"
                />
              </div>

              {/* Names, Handle & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1
                    className={`text-2xl sm:text-3xl font-display font-black tracking-tight ${
                      isAdmin
                        ? 'bg-gradient-to-r from-amber-100 via-yellow-300 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(245,158,11,0.6)]'
                        : 'text-white'
                    }`}
                  >
                    {displayName || currentUser.username}
                  </h1>
                  {isAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 text-amber-200 border border-amber-400/60 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-400/40" />
                      Sovereign Admin
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                      Member
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="text-neutral-400 font-medium">@{username || currentUser.username}</span>
                  <span className="text-neutral-600">•</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 ${rank.titleBadgeColor}`}>
                    <Trophy className="w-3 h-3" />
                    <span>Level {rank.level}</span>
                    <span className="text-white/60">({rank.title})</span>
                  </span>
                </div>

                {/* Social Followers & Following Counters */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSocialModalOpen('following')}
                    className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="font-extrabold text-white group-hover:text-rose-400 font-mono text-xs">
                      {followData.following.length}
                    </span>
                    <span className="text-neutral-400 text-xs">Following</span>
                  </button>

                  <span className="text-neutral-700">•</span>

                  <button
                    type="button"
                    onClick={() => setSocialModalOpen('followers')}
                    className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="font-extrabold text-white group-hover:text-rose-400 font-mono text-xs">
                      {followData.followers.length}
                    </span>
                    <span className="text-neutral-400 text-xs">Followers</span>
                  </button>

                  {gender && (
                    <>
                      <span className="text-neutral-700">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-[11px] font-medium text-neutral-300">
                        {gender}
                      </span>
                    </>
                  )}
                </div>

                {/* Status message */}
                {statusMessage && (
                  <p className="text-xs sm:text-sm text-neutral-300 italic max-w-md pt-0.5">
                    "{statusMessage}"
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyProfileCard}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-neutral-200 transition-all cursor-pointer"
                title="Copy profile card text"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Share Card</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('edit')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/20 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await logoutUser();
                  window.location.reload();
                }}
                className="p-2 rounded-xl bg-neutral-800/90 hover:bg-red-950/60 hover:text-red-400 border border-neutral-700/80 text-neutral-400 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Otaku XP Progress</span>
              </span>
              <span className="text-neutral-300 font-mono text-[11px]">
                {rank.currentProgressXp} / 100 XP to <strong className="text-white">Level {rank.level + 1}</strong>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${rank.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROFILE NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveProfileTab('showcase')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'showcase'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Showcase & Library</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'edit'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Customize Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'preferences'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Preferences & Settings</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveProfileTab('admin_console')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeProfileTab === 'admin_console'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-lg shadow-amber-950/40 font-black'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-500/40'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Admin Authority</span>
            </button>
          )}
        </div>

        {/* Secondary Hub Actions */}
        <div className="hidden md:flex items-center gap-2">
          {onOpenStats && (
            <button
              type="button"
              onClick={onOpenStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-cyan-400 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Full Analytics</span>
            </button>
          )}

          {onOpenImportExport && (
            <button
              type="button"
              onClick={onOpenImportExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Backup / Export</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TAB CONTENT: SHOWCASE & LIBRARY */}
      {activeProfileTab === 'showcase' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Shelf</span>
              <span className="text-2xl font-extrabold text-white font-mono mt-1">{shelfStats.total}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Anime & Manga</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Watching</span>
              <span className="text-2xl font-extrabold text-emerald-300 font-mono mt-1">{shelfStats.watching}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Active Series</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">Completed</span>
              <span className="text-2xl font-extrabold text-sky-300 font-mono mt-1">{shelfStats.completed}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Finished Runs</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Plan to Watch</span>
              <span className="text-2xl font-extrabold text-amber-300 font-mono mt-1">{shelfStats.plan}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Backlog Queue</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Mean Score</span>
              <span className="text-2xl font-extrabold text-purple-300 font-mono mt-1">{shelfStats.meanRating}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Rated Titles</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Manga Read</span>
              <span className="text-2xl font-extrabold text-rose-300 font-mono mt-1">{shelfStats.mangaCount}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Volumes/Series</span>
            </div>
          </div>

          {/* Shelf Status Distribution Bar */}
          {shelfStats.total > 0 && (
            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-semibold">Shelf Distribution</span>
                <span className="text-neutral-400 text-[11px] font-mono">{shelfStats.total} total items</span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-950 overflow-hidden flex gap-0.5 p-0.5 border border-neutral-800">
                {shelfStats.watching > 0 && (
                  <div
                    className="h-full bg-emerald-500 rounded-xs transition-all"
                    style={{ width: `${(shelfStats.watching / shelfStats.total) * 100}%` }}
                    title={`Watching: ${shelfStats.watching}`}
                  />
                )}
                {shelfStats.completed > 0 && (
                  <div
                    className="h-full bg-sky-500 rounded-xs transition-all"
                    style={{ width: `${(shelfStats.completed / shelfStats.total) * 100}%` }}
                    title={`Completed: ${shelfStats.completed}`}
                  />
                )}
                {shelfStats.plan > 0 && (
                  <div
                    className="h-full bg-amber-500 rounded-xs transition-all"
                    style={{ width: `${(shelfStats.plan / shelfStats.total) * 100}%` }}
                    title={`Plan to Watch: ${shelfStats.plan}`}
                  />
                )}
                {shelfStats.onHold > 0 && (
                  <div
                    className="h-full bg-purple-500 rounded-xs transition-all"
                    style={{ width: `${(shelfStats.onHold / shelfStats.total) * 100}%` }}
                    title={`On Hold: ${shelfStats.onHold}`}
                  />
                )}
                {shelfStats.dropped > 0 && (
                  <div
                    className="h-full bg-red-500 rounded-xs transition-all"
                    style={{ width: `${(shelfStats.dropped / shelfStats.total) * 100}%` }}
                    title={`Dropped: ${shelfStats.dropped}`}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Watching ({shelfStats.watching})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> Completed ({shelfStats.completed})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Plan to Watch ({shelfStats.plan})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> On Hold ({shelfStats.onHold})</span>
              </div>
            </div>
          )}

          {/* About Me & Quote Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  About Me
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {bio || 'No biography written yet. Click "Customize Identity" above to introduce yourself to fellow fans!'}
                </p>
              </div>

              {favoriteQuote && (
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-start gap-3">
                  <span className="text-rose-400 text-xl font-serif leading-none">“</span>
                  <p className="text-xs text-neutral-300 italic font-medium leading-relaxed">
                    {favoriteQuote}
                  </p>
                </div>
              )}

              {/* Favorite Genres Chips */}
              {favoriteGenres.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-neutral-400 mb-2">Favorite Genres</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteGenres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-1 rounded-lg bg-neutral-950 text-neutral-300 border border-neutral-800 text-xs font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Social & Identity Meta */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                Connected Handles
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">Discord</span>
                  <span className="text-neutral-200 font-mono font-medium">
                    {socialDiscord || 'Not set'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">AniList</span>
                  <span className="text-neutral-200 font-mono font-medium">
                    {socialAnilist || 'Not set'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-400">MyAnimeList</span>
                  <span className="text-neutral-200 font-mono font-medium">
                    {socialMal || 'Not set'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <p className="text-[11px] text-neutral-500">
                  Member since {new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </div>

          {/* Pinned Showcase Titles (Top 4 Favorites) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Spotlight Highlights ({pinnedItems.length}/4)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPinSelectorOpen(true)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Change Spotlight
              </button>
            </div>

            {pinnedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {pinnedItems.map((item) => (
                  <div
                    key={`pinned-${item.id}`}
                    onClick={() => {
                      if (item.mediaType === 'manga' && onSelectManga) {
                        onSelectManga(item.title);
                      } else if (onSelectAnime) {
                        onSelectAnime({ mal_id: item.id, title: item.title, images: { jpg: { large_image_url: item.image } } });
                      }
                    }}
                    className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-rose-500/60 transition-all cursor-pointer shadow-lg hover:shadow-rose-950/20"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                      {item.userRating && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.userRating}/10</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                          {item.status.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-1 group-hover:text-rose-400 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-neutral-900/60 border border-dashed border-neutral-800 text-center space-y-2">
                <Bookmark className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm text-neutral-400 font-medium">
                  Your spotlight is currently empty.
                </p>
                <p className="text-xs text-neutral-500">
                  Add anime or manga to your shelf, then pin your favorite masterpieces here!
                </p>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('home')}
                    className="mt-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Badges & Achievements Showcase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Otaku Milestones & Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    badge.unlocked
                      ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-950/60 border-neutral-900 opacity-50'
                  }`}
                >
                  <div className="text-2xl shrink-0 p-1 rounded-lg bg-neutral-950 border border-neutral-800">
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">{badge.title}</h4>
                      {badge.unlocked && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: CUSTOMIZE IDENTITY */}
      {activeProfileTab === 'edit' && (
        <div className="space-y-8">
          <form onSubmit={handleSave} className="space-y-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-950/50 border border-red-900/60 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-200 leading-relaxed">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-900/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
                  Profile updated successfully! All changes are synchronized with your account.
                </p>
              </div>
            )}

            {/* Basic Info: Display Name, Username, Gender & Status */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                Core Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    required
                    minLength={2}
                    maxLength={50}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <p className="text-[11px] text-neutral-500">Your visible name across Kuro Shelf.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 block">
                      Username
                    </label>
                    {isAdmin && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Admin Tier
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                      placeholder="username"
                      required
                      minLength={2}
                      maxLength={30}
                      className={`w-full bg-neutral-950 border rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                        username.length > 0 && username.length <= 4 && !isAdmin
                          ? 'border-amber-500/80 focus:border-amber-400'
                          : 'border-neutral-800 focus:border-rose-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {username.trim().toLowerCase() === 'kuro' ? (
                      <span className="text-amber-400 font-semibold">
                        ★ Sovereign Administrator handle: Full system authority granted.
                      </span>
                    ) : username.length > 0 && username.length <= 4 ? (
                      <span className="text-amber-400/90 font-medium">
                        Short usernames (4 characters or fewer) are reserved for Administrators.
                      </span>
                    ) : (
                      'Unique account handle (letters, numbers, _, .).'
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Rather not say">Rather not say</option>
                    <option value="Others">Others</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">Optional identity tag displayed on your profile card.</p>
                </div>

                {/* Status Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Status Message / Current Vibe
                  </label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Enter what you are currently watching or thinking..."
                    maxLength={100}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <p className="text-[11px] text-neutral-500">Broadcasted beneath your name.</p>
                </div>
              </div>
            </div>

            {/* Avatar & Frame Selection */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                  Avatar & Frame Styling
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Choose an anime preset avatar and choose a glowing signature border color.
                </p>
              </div>

              {/* Frame Accent Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Glowing Frame Color
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {[
                    { id: 'rose', name: 'Crimson Rose', bg: 'bg-rose-500' },
                    { id: 'cyan', name: 'Cyber Cyan', bg: 'bg-cyan-400' },
                    { id: 'amber', name: 'Solar Amber', bg: 'bg-amber-400' },
                    { id: 'violet', name: 'Arcane Violet', bg: 'bg-purple-400' },
                    { id: 'emerald', name: 'Jade Emerald', bg: 'bg-emerald-400' }
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setFrameColor(color.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        frameColor === color.id
                          ? 'bg-neutral-800 text-white border-white shadow-md'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${color.bg}`} />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>

                {/* Exclusive Admin Avatar Frames */}
                {isAdmin && (
                  <div className="pt-3 mt-3 border-t border-neutral-800/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sovereign Admin Exclusive Frames</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {[
                        { id: 'dragon_gold', name: 'Imperial Dragon (Gold & Claws)', badge: 'Gilded Dragon' },
                        { id: 'astral_sovereign', name: 'Celestial Astral God', badge: 'Rotating Halo' },
                        { id: 'void_singularity', name: 'Obsidian Void Singularity', badge: 'Dark Corona' }
                      ].map((adminFrame) => (
                        <button
                          key={adminFrame.id}
                          type="button"
                          onClick={() => setFrameColor(adminFrame.id as any)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            frameColor === adminFrame.id
                              ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 text-amber-200 border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                              : 'bg-neutral-950 text-amber-300/80 border-amber-500/30 hover:border-amber-400/60'
                          }`}
                        >
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>{adminFrame.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Choose Anime Avatar Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 border-rose-500 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/50 scale-[1.03]'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden shadow-md flex items-center justify-center">
                          <AnimeAvatar presetId={preset.id} frameColor="rose" size="md" />
                        </div>
                        <div className="text-center w-full">
                          <h5 className="text-xs font-bold text-white truncate">{preset.name}</h5>
                          <span className="text-[10px] text-neutral-500">{preset.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Banner Theme Selection */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                  Profile Header Banner
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Select an ambient header theme to transform your profile background.
                </p>
              </div>

              {/* Exclusive Admin Banners (Only visible to Admins) */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-amber-950/40 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Sovereign Administrator Banners (Exclusive to Admins)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 ml-auto">
                      Admin Only
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    High-visual animated banners featuring custom cosmic vortex accretion rings, celestial auroras, and the imperial watermark. Normal users cannot discover or equip these.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {BANNER_THEMES.filter((t) => t.isAdminOnly).map((theme) => {
                      const isSelected = selectedBannerId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedBannerId(theme.id)}
                          className={`h-28 rounded-2xl p-4 flex flex-col justify-between text-left border relative overflow-hidden transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 shadow-2xl ring-2 ring-amber-400/80 scale-[1.02]'
                              : 'border-amber-500/30 hover:border-amber-400/60'
                          } bg-gradient-to-r ${theme.gradient}`}
                        >
                          <div className="absolute inset-0 bg-black/40" />
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-[9px] font-black text-amber-200 uppercase tracking-wider">
                              {theme.visualEffect}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                          </div>
                          <div className="relative z-10">
                            <h5 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <span>{theme.name}</span>
                            </h5>
                            <p className="text-[10px] text-amber-100/90 mt-0.5">{theme.tagline}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard Themes */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Curated Banner Themes
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BANNER_THEMES.filter((t) => !t.isAdminOnly).map((theme) => {
                    const isSelected = selectedBannerId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedBannerId(theme.id)}
                        className={`h-24 rounded-2xl p-4 flex flex-col justify-end text-left border relative overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white shadow-xl ring-2 ring-rose-500'
                            : 'border-neutral-800 hover:border-neutral-700'
                        } bg-gradient-to-r ${theme.gradient}`}
                      >
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative z-10">
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{theme.name}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                          </h5>
                          <p className="text-[10px] text-neutral-300 mt-0.5">{theme.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bio & Favorite Quote */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                Bio & Quotes
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-neutral-300">About Me (Bio)</label>
                  <span className="text-neutral-500">{bio.length}/500</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Tell fellow members what genres you love, what you are currently watching, or what anime changed your life..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Favorite Anime / Manga Quote
                </label>
                <input
                  type="text"
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="Whatever happens, happens. — Spike Spiegel"
                  maxLength={150}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Genre Multi-Select */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Favorite Genres (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_GENRES.map((genre) => {
                    const isSelected = favoriteGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleToggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Social Handles */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                Community & External Accounts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Discord Handle</label>
                  <input
                    type="text"
                    value={socialDiscord}
                    onChange={(e) => setSocialDiscord(e.target.value)}
                    placeholder="otaku#1234"
                    maxLength={40}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">AniList Username</label>
                  <input
                    type="text"
                    value={socialAnilist}
                    onChange={(e) => setSocialAnilist(e.target.value)}
                    placeholder="my_anilist_name"
                    maxLength={40}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">MyAnimeList Username</label>
                  <input
                    type="text"
                    value={socialMal}
                    onChange={(e) => setSocialMal(e.target.value)}
                    placeholder="my_mal_handle"
                    maxLength={40}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveProfileTab('showcase')}
                className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                Back to Showcase
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-rose-900/30 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. TAB CONTENT: PREFERENCES & SETTINGS */}
      {activeProfileTab === 'preferences' && (
        <div className="space-y-6">
          {/* Display & Language Preferences */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
              Title Language Preference
            </h3>
            <p className="text-xs text-neutral-400">
              Choose how anime & manga titles appear by default across cards, lists, and details.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: 'romaji', label: 'Romaji (Japanese)', example: 'Shingeki no Kyojin' },
                { id: 'english', label: 'English Official', example: 'Attack on Titan' },
                { id: 'japanese', label: 'Native Script', example: '進撃の巨人' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setTitleLanguage(lang.id as any);
                    const updated = { ...customization, title_language_preference: lang.id as any };
                    setCustomization(updated);
                    saveStoredProfileCustomization(updated, currentUser.id);
                  }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    titleLanguage === lang.id
                      ? 'bg-neutral-800 border-rose-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{lang.label}</span>
                  <span className="text-[11px] text-neutral-400 italic mt-1">{lang.example}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spoiler Protection */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
              Content & Spoiler Filters
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div>
                <h4 className="text-xs font-semibold text-white">Spoiler Blur Protection</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Automatically blur comments and synopses flagged with plot spoilers until clicked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !spoilerBlur;
                  setSpoilerBlur(nextVal);
                  const updated = { ...customization, spoiler_blur_enabled: nextVal };
                  setCustomization(updated);
                  saveStoredProfileCustomization(updated, currentUser.id);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  spoilerBlur ? 'bg-rose-600' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    spoilerBlur ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Hub Navigation */}
          {onNavigateTab && (
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                Quick Library Shortcuts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('shelf')}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors">
                        My Shelf & Watchlist
                      </h5>
                      <p className="text-[11px] text-neutral-400">
                        {shelfStats.total > 0 ? `${shelfStats.total} saved titles` : 'Track anime & manga'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-rose-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('schedule')}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                        Weekly Airing Schedule
                      </h5>
                      <p className="text-[11px] text-neutral-400">Live countdowns & air times</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('manga')}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white group-hover:text-purple-400 transition-colors">
                        Manga & Light Novels
                      </h5>
                      <p className="text-[11px] text-neutral-400">Explore published volumes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('polls')}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Vote className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        Community Predictions
                      </h5>
                      <p className="text-[11px] text-neutral-400">Vote on weekly episodes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* Account Security & Sign Out */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 text-neutral-300">
              <Shield className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Account Security & Cloud Identity
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              Your identity is protected by Row Level Security (RLS). Only your authenticated session can modify your watchlist, ratings, and profile setup.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await logoutUser();
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-xs font-bold text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Kuro Shelf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: ADMIN AUTHORITY CONSOLE */}
      {activeProfileTab === 'admin_console' && isAdmin && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Admin Hero Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-amber-950/20 to-neutral-900 border border-amber-500/40 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-400/30" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                    Kuro Shelf Sovereign Authority
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                  Administrator Role & Perks Console
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                  Promote accounts to Administrator, manage system authority, and review the special dragon banner and golden styling privileges.
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 shrink-0">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Master Access Active</span>
              </div>
            </div>
          </div>

          {/* Feedback Notice */}
          {adminActionNotice && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                adminActionNotice.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {adminActionNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{adminActionNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminActionNotice(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Interactive Role Delegation Tool */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-lg">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Grant Administrator Role to User</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Enter any username to immediately elevate them to Kuro Shelf Administrator status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={promoteTargetInput}
                  onChange={(e) => setPromoteTargetInput(e.target.value)}
                  placeholder="e.g. kuro, sima72460, dev"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm font-mono focus:outline-hidden focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = promoteTargetInput.trim().replace(/^@/, '');
                  if (!target) {
                    setAdminActionNotice({ type: 'error', message: 'Please enter a valid username to promote.' });
                    return;
                  }
                  promoteToAdmin(target);
                  setAdminRoster(getAdminList());
                  setPromoteTargetInput('');
                  setAdminActionNotice({
                    type: 'success',
                    message: `Account @${target} is now officially a Kuro Shelf Administrator! They now have access to metallic gold names, popping dragon banners, and exclusive avatar frames.`
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Promote to Admin</span>
              </button>
            </div>
          </div>

          {/* Current Administrators Roster */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Current Administrator Roster ({adminRoster.length})</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Accounts with sovereign permissions, exclusive dragon banners, and golden typography.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {adminRoster.map((adminUser) => {
                const isSovereign = adminUser.toLowerCase() === 'kuro';
                return (
                  <div
                    key={adminUser}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black font-black text-sm shadow-sm">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-amber-200">@{adminUser}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {isSovereign ? 'Sovereign' : 'Admin'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          {isSovereign ? 'Permanent System Administrator' : 'Delegated Administrator'}
                        </p>
                      </div>
                    </div>

                    {!isSovereign && (
                      <button
                        type="button"
                        onClick={() => {
                          demoteFromAdmin(adminUser);
                          setAdminRoster(getAdminList());
                          setAdminActionNotice({
                            type: 'success',
                            message: `Admin privileges removed for @${adminUser}.`
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-800 text-[11px] font-semibold text-neutral-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Demote
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide: How to Make an Account Admin Later */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Guide: How to Make an Account an Admin Later</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Here are the 4 official ways to grant administrator privileges on Kuro Shelf:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
                  <span>In-App Promotion (Fastest)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Right here in this <strong>Admin Authority Console</strong>, type any username into the promotion box and click <em>Promote to Admin</em>. The user is instantly upgraded across the platform!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                  <span>4-Character Handles (Automatic)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Any account created with a handle of 4 characters or fewer (e.g. <code>@Kuro</code>, <code>@Boss</code>, <code>@Dev</code>, <code>@Zero</code>) is automatically designated with Administrator role and authority.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">3</span>
                  <span>Supabase / Database Metadata</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  In the Supabase Dashboard &rarr; <strong>Authentication &rarr; Users</strong> &rarr; select the user &rarr; edit user metadata and add <code>"role": "admin"</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
                  <span>Codebase Registry</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  In <code>src/services/profileCustomizationService.ts</code>, any username returned in <code>getAdminList()</code> has hardcoded sovereign rights.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: PIN SELECTOR */}
      {pinSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Choose Spotlight Titles</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Select up to 4 titles from your shelf to feature on your profile showcase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPinSelectorOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {shelf.length > 0 ? (
                shelf.map((item) => {
                  const isPinned = pinnedShelfIds.includes(item.id);
                  return (
                    <div
                      key={`pin-option-${item.id}`}
                      onClick={() => handleTogglePin(item.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isPinned
                          ? 'bg-rose-950/30 border-rose-500/60'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                          isPinned
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {isPinned ? <Check className="w-3.5 h-3.5" /> : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-neutral-500">
                  No items in shelf yet. Add some anime or manga to pin them!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...customization, pinned_shelf_ids: pinnedShelfIds };
                  setCustomization(updated);
                  saveStoredProfileCustomization(updated, currentUser.id);
                  setPinSelectorOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: FOLLOWING & FOLLOWERS */}
      {socialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen('following')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    socialModalOpen === 'following'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  Following ({followData.following.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSocialModalOpen('followers')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    socialModalOpen === 'followers'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  Followers ({followData.followers.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSocialModalOpen(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Users */}
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {socialModalOpen === 'following' ? (
                followData.following.length > 0 ? (
                  INITIAL_COMMUNITY_USERS.filter((u) => followData.following.includes(u.id)).map((u) => {
                    const userIsAdmin = isAdminUser(u);
                    return (
                      <div
                        key={`following-${u.id}`}
                        className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 hover:border-neutral-700 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AnimeAvatar
                            presetId={u.avatar_preset || 'shadow_shinobi'}
                            frameColor={userIsAdmin ? 'dragon_gold' : 'rose'}
                            size="sm"
                            isAdmin={userIsAdmin}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4
                                className={`text-xs font-bold truncate ${
                                  userIsAdmin
                                    ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black drop-shadow-[0_1px_6px_rgba(245,158,11,0.4)]'
                                    : 'text-white'
                                }`}
                              >
                                {u.display_name}
                              </h4>
                              {userIsAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-xs">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" /> Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate">
                              <span className={userIsAdmin ? 'text-amber-300/90 font-mono font-bold' : ''}>
                                @{u.username}
                              </span>
                              <span>•</span>
                              <span className="text-neutral-500">{u.levelTitle || 'Member'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-red-950/40 hover:text-red-300 hover:border-red-900/60 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-all cursor-pointer shrink-0"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Following</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-neutral-500 text-xs">
                    You are not following any members yet.
                  </div>
                )
              ) : (
                followData.followers.length > 0 ? (
                  INITIAL_COMMUNITY_USERS.filter((u) => followData.followers.includes(u.id)).map((u) => {
                    const isFollowingBack = followData.following.includes(u.id);
                    const userIsAdmin = isAdminUser(u);
                    return (
                      <div
                        key={`follower-${u.id}`}
                        className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 hover:border-neutral-700 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AnimeAvatar
                            presetId={u.avatar_preset || 'shadow_shinobi'}
                            frameColor={userIsAdmin ? 'dragon_gold' : 'rose'}
                            size="sm"
                            isAdmin={userIsAdmin}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4
                                className={`text-xs font-bold truncate ${
                                  userIsAdmin
                                    ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black drop-shadow-[0_1px_6px_rgba(245,158,11,0.4)]'
                                    : 'text-white'
                                }`}
                              >
                                {u.display_name}
                              </h4>
                              {userIsAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-xs">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" /> Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate">
                              <span className={userIsAdmin ? 'text-amber-300/90 font-mono font-bold' : ''}>
                                @{u.username}
                              </span>
                              <span>•</span>
                              <span className="text-neutral-500">{u.levelTitle || 'Member'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(u.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                            isFollowingBack
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                              : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm'
                          }`}
                        >
                          {isFollowingBack ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow Back</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-neutral-500 text-xs">
                    No followers yet. Track more anime and share your profile!
                  </div>
                )
              )}
            </div>

            {/* Discover Section */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>Discover Curators</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Suggested</span>
              </div>

              <div className="space-y-2">
                {INITIAL_COMMUNITY_USERS.filter((u) => !followData.following.includes(u.id)).slice(0, 2).map((u) => {
                  const presetIcon = AVATAR_PRESETS.find((p) => p.id === u.avatar_preset)?.svgIcon || '🗡️';
                  return (
                    <div
                      key={`suggest-${u.id}`}
                      className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-base shrink-0">
                          {presetIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h5 className="text-xs font-bold text-white truncate">{u.display_name}</h5>
                            {u.role === 'admin' && (
                              <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400">@{u.username} • {u.shelfCount} titles</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(u.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-all shrink-0"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
