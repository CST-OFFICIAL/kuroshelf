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
  Cloud,
  HardDrive,
  Upload,
  Image as ImageIcon,
  ShieldAlert,
  Trash2,
  Loader2,
  Play,
  Search,
  Heart
} from 'lucide-react';
import { AuthUser, ShelfEntry, ShelfStatus, UserActivity, UserProfileCustomization, DailyStreakInfo } from '../types';
import { updateProfileSetup, logoutUser } from '../services/authService';
import { isUserDonor } from '../services/membershipService';
import {
  isGoogleDriveConnected,
  requestGoogleDriveAuth,
  uploadBackupToDrive,
  disconnectGoogleDrive
} from '../services/googleDriveService';
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
import { DailyStreakWidget } from './DailyStreakWidget';

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
  streakInfo?: DailyStreakInfo;
  onStreakUpdated?: (info: DailyStreakInfo) => void;
  onOpenAccountSwitcher?: () => void;
  savedAccountsCount?: number;
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
  shelfCount: _shelfCount = 0,
  streakInfo,
  onStreakUpdated,
  onOpenAccountSwitcher,
  savedAccountsCount = 1,
}: ProfileViewProps) {
  // Active inner profile tab
  const [activeProfileTab, setActiveProfileTab] = useState<'showcase' | 'edit' | 'preferences' | 'admin_console'>('showcase');
  const [showcaseSubTab, setShowcaseSubTab] = useState<'overview' | 'animelist' | 'mangalist' | 'spotlight' | 'milestones'>('overview');
  const [listStatusFilter, setListStatusFilter] = useState<'all' | ShelfStatus>('all');
  const [listSearch, setListSearch] = useState('');

  // Stored custom preferences
  const [customization, setCustomization] = useState(() =>
    getStoredProfileCustomization(currentUser?.id)
  );

  // Admin status check
  const isAdmin = useMemo(() => isAdminUser(currentUser), [currentUser]);

  // Donor status check (distinct from membership!)
  const [isDonor, setIsDonor] = useState(() => currentUser?.is_donor || isUserDonor(currentUser?.id));

  useEffect(() => {
    const handleDonorUpdate = () => {
      setIsDonor(currentUser?.is_donor || isUserDonor(currentUser?.id));
    };
    window.addEventListener('kuroshelf_donor_status_changed', handleDonorUpdate);
    window.addEventListener('kuroshelf_donation_made', handleDonorUpdate);
    return () => {
      window.removeEventListener('kuroshelf_donor_status_changed', handleDonorUpdate);
      window.removeEventListener('kuroshelf_donation_made', handleDonorUpdate);
    };
  }, [currentUser]);

  // Admin Console States
  const [adminRoster, setAdminRoster] = useState<string[]>(() => getAdminList());
  const [promoteTargetInput, setPromoteTargetInput] = useState('');
  const [adminActionNotice, setAdminActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState(currentUser?.display_name || currentUser?.username || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [gender, setGender] = useState<string>(customization.gender || '');
  const [selectedPresetId, setSelectedPresetId] = useState(customization.avatar_preset || 'silly_derp_cat');
  const [frameColor, setFrameColor] = useState(customization.avatar_frame_color || 'none');
  const [selectedBannerId, setSelectedBannerId] = useState(customization.banner_preset || 'midnight_obsidian');
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
  const [socialSearch, setSocialSearch] = useState('');

  // Quick unpin handler directly from spotlight card
  const handleUnpinSpotlight = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const nextPinned = pinnedShelfIds.filter((pId) => pId !== id);
    setPinnedShelfIds(nextPinned);
    const updatedCustom = { ...customization, pinned_shelf_ids: nextPinned };
    setCustomization(updatedCustom);
    if (currentUser) {
      saveStoredProfileCustomization(updatedCustom, currentUser.id);
    }
  };

  // Pin selector modal
  const [pinSelectorOpen, setPinSelectorOpen] = useState(false);

  // Google Drive state
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom Avatar & Safety Moderation state
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(
    customization.avatar_url || currentUser?.avatar_url || null
  );
  const [avatarScanning, setAvatarScanning] = useState(false);
  const [avatarScanResult, setAvatarScanResult] = useState<{
    safe: boolean;
    message: string;
  } | null>(null);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    setAvatarScanResult(null);

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select a valid image file (JPEG, PNG, WEBP, or GIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarUploadError('Image is too large. Please select a photo under 8MB.');
      return;
    }

    setAvatarScanning(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('Failed to parse image data.'));
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const size = 320;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Canvas context could not be created.'));
                return;
              }

              const minDim = Math.min(img.width, img.height);
              const sx = (img.width - minDim) / 2;
              const sy = (img.height - minDim) / 2;
              ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

              const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
              resolve(dataUrl);
            } catch (canvasErr) {
              reject(canvasErr);
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/moderate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();

      if (!data.safe) {
        setAvatarScanResult({
          safe: false,
          message:
            data.reason ||
            'This photo was flagged by our safety guard as containing explicit, adult, or graphic material. In order to protect community members, please choose a friendly or anime-appropriate picture.',
        });
      } else {
        setCustomAvatarUrl(base64Data);
        setAvatarScanResult({
          safe: true,
          message: '✓ Photo verified safe by Community Guard! Remember to click "Save Changes" below.',
        });
      }
    } catch (err: any) {
      console.error('Avatar upload/moderation error:', err);
      setAvatarUploadError(err.message || 'Failed to scan image. Please try again.');
    } finally {
      setAvatarScanning(false);
      e.target.value = '';
    }
  };

  const handleRemoveCustomAvatar = () => {
    setCustomAvatarUrl(null);
    setAvatarScanResult(null);
    setAvatarUploadError(null);
  };

  const handleDriveBackupFromProfile = async () => {
    try {
      setDriveSyncing(true);
      setDriveStatusMsg(null);
      if (!isGoogleDriveConnected()) {
        await requestGoogleDriveAuth();
      }
      const file = await uploadBackupToDrive(shelf, customization);
      setDriveStatusMsg({
        type: 'success',
        message: `Backup "${file.name}" saved to Google Drive with ${shelf.length} titles!`
      });
    } catch (err: any) {
      setDriveStatusMsg({ type: 'error', message: err.message || 'Failed to backup to Google Drive.' });
    } finally {
      setDriveSyncing(false);
    }
  };

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
      setCustomAvatarUrl(loaded.avatar_url || currentUser.avatar_url || null);
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

  // Authentic MAL Anime Statistics calculation (~23.5 min/episode)
  const animeStats = useMemo(() => {
    const animeItems = shelf.filter((s) => s.mediaType === 'anime' || !s.mediaType);
    const total = animeItems.length;
    const watching = animeItems.filter((s) => s.status === 'watching').length;
    const completed = animeItems.filter((s) => s.status === 'completed').length;
    const onHold = animeItems.filter((s) => s.status === 'on_hold').length;
    const dropped = animeItems.filter((s) => s.status === 'dropped').length;
    const plan = animeItems.filter((s) => s.status === 'plan_to_watch').length;

    const totalEpisodes = animeItems.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    const daysWatched = ((totalEpisodes * 23.5) / 1440).toFixed(1);

    const ratedAnime = animeItems.filter((s) => typeof s.userRating === 'number' && s.userRating > 0);
    const meanScore = ratedAnime.length > 0
      ? (ratedAnime.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedAnime.length).toFixed(2)
      : '0.00';

    return {
      total,
      watching,
      completed,
      onHold,
      dropped,
      plan,
      totalEpisodes,
      daysWatched,
      meanScore,
      ratedCount: ratedAnime.length
    };
  }, [shelf]);

  // Authentic MAL Manga Statistics calculation (~6.0 min/chapter)
  const mangaStats = useMemo(() => {
    const mangaItems = shelf.filter((s) => s.mediaType === 'manga');
    const total = mangaItems.length;
    const reading = mangaItems.filter((s) => s.status === 'watching').length;
    const completed = mangaItems.filter((s) => s.status === 'completed').length;
    const onHold = mangaItems.filter((s) => s.status === 'on_hold').length;
    const dropped = mangaItems.filter((s) => s.status === 'dropped').length;
    const plan = mangaItems.filter((s) => s.status === 'plan_to_watch').length;

    const totalChapters = mangaItems.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    const daysRead = ((totalChapters * 6.0) / 1440).toFixed(1);

    const ratedManga = mangaItems.filter((s) => typeof s.userRating === 'number' && s.userRating > 0);
    const meanScore = ratedManga.length > 0
      ? (ratedManga.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedManga.length).toFixed(2)
      : '0.00';

    return {
      total,
      reading,
      completed,
      onHold,
      dropped,
      plan,
      totalChapters,
      daysRead,
      meanScore,
      ratedCount: ratedManga.length
    };
  }, [shelf]);

  // Authentic MAL Score Distribution Curve (10 down to 1)
  const scoreDistribution = useMemo(() => {
    const distribution: { score: number; label: string; count: number; percent: number }[] = [
      { score: 10, label: 'Masterpiece', count: 0, percent: 0 },
      { score: 9, label: 'Great', count: 0, percent: 0 },
      { score: 8, label: 'Very Good', count: 0, percent: 0 },
      { score: 7, label: 'Good', count: 0, percent: 0 },
      { score: 6, label: 'Fine', count: 0, percent: 0 },
      { score: 5, label: 'Average', count: 0, percent: 0 },
      { score: 4, label: 'Bad', count: 0, percent: 0 },
      { score: 3, label: 'Very Bad', count: 0, percent: 0 },
      { score: 2, label: 'Horrible', count: 0, percent: 0 },
      { score: 1, label: 'Appalling', count: 0, percent: 0 },
    ];

    const ratedItems = shelf.filter((s) => typeof s.userRating === 'number' && s.userRating > 0);
    const totalRated = ratedItems.length;

    ratedItems.forEach((item) => {
      const rounded = Math.min(10, Math.max(1, Math.round(item.userRating!)));
      const entry = distribution.find((d) => d.score === rounded);
      if (entry) entry.count += 1;
    });

    if (totalRated > 0) {
      distribution.forEach((d) => {
        d.percent = Math.round((d.count / totalRated) * 100);
      });
    }

    return { distribution, totalRated };
  }, [shelf]);

  // Shelf quick breakdown
  const shelfStats = useMemo(() => {
    const total = shelf.length;
    const watching = shelf.filter((s) => s.status === 'watching').length;
    const completed = shelf.filter((s) => s.status === 'completed').length;
    const plan = shelf.filter((s) => s.status === 'plan_to_watch').length;
    const onHold = shelf.filter((s) => s.status === 'on_hold').length;
    const dropped = shelf.filter((s) => s.status === 'dropped').length;
    const animeCount = shelf.filter((s) => s.mediaType === 'anime' || !s.mediaType).length;
    const mangaCount = shelf.filter((s) => s.mediaType === 'manga').length;

    const ratedItems = shelf.filter((s) => (s.userRating || 0) > 0);
    const meanRating = ratedItems.length > 0
      ? (ratedItems.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedItems.length).toFixed(1)
      : 'N/A';

    return { total, watching, completed, plan, onHold, dropped, animeCount, mangaCount, meanRating };
  }, [shelf]);

  // Filtered lists for MAL interactive tables
  const filteredAnimeList = useMemo(() => {
    return shelf.filter((s) => {
      const isAnime = s.mediaType === 'anime' || !s.mediaType;
      if (!isAnime) return false;
      if (listStatusFilter !== 'all' && s.status !== listStatusFilter) return false;
      if (listSearch.trim() && !s.title.toLowerCase().includes(listSearch.toLowerCase())) return false;
      return true;
    });
  }, [shelf, listStatusFilter, listSearch]);

  const filteredMangaList = useMemo(() => {
    return shelf.filter((s) => {
      const isManga = s.mediaType === 'manga';
      if (!isManga) return false;
      if (listStatusFilter !== 'all' && s.status !== listStatusFilter) return false;
      if (listSearch.trim() && !s.title.toLowerCase().includes(listSearch.toLowerCase())) return false;
      return true;
    });
  }, [shelf, listStatusFilter, listSearch]);

  // Filtered available banners (admins see exclusive ones; normal users do not)
  const availableBanners = useMemo(() => {
    return BANNER_THEMES.filter((theme) => !theme.isAdminOnly || isAdmin);
  }, [isAdmin]);

  // Selected banner theme details (strictly filtered so normal users cannot render admin banners)
  const activeBannerTheme = useMemo(
    () => availableBanners.find((b) => b.id === selectedBannerId) || availableBanners[0] || BANNER_THEMES[0],
    [availableBanners, selectedBannerId]
  );

  // Filtered available avatars (admins see exclusive ones; normal users do not)
  const availableAvatars = useMemo(() => {
    return AVATAR_PRESETS.filter((preset) => !preset.isAdminOnly || isAdmin);
  }, [isAdmin]);

  // Selected avatar preset (strictly filtered so normal users cannot render admin avatars)
  const activeAvatarPreset = useMemo(
    () => availableAvatars.find((p) => p.id === selectedPresetId) || availableAvatars[0] || AVATAR_PRESETS[0],
    [availableAvatars, selectedPresetId]
  );

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
          customAvatarUrl || undefined
        );

        if (!res.success) {
          setError(res.error || 'Failed to update profile identity.');
          setLoading(false);
          return;
        }
      }

      // Ensure non-admins cannot save admin-only presets or themes
      let sanitizedPresetId = selectedPresetId;
      if (!isAdmin) {
        const isPresetAdmin = AVATAR_PRESETS.find((p) => p.id === selectedPresetId)?.isAdminOnly;
        if (isPresetAdmin) sanitizedPresetId = 'curator_cyber_dark';
      }

      let sanitizedBannerId = selectedBannerId;
      if (!isAdmin) {
        const isBannerAdmin = BANNER_THEMES.find((t) => t.id === selectedBannerId)?.isAdminOnly;
        if (isBannerAdmin) sanitizedBannerId = 'tokyo_twilight';
      }

      // Save local aesthetic customization
      const updatedCustom: UserProfileCustomization = {
        avatar_url: customAvatarUrl || undefined,
        avatar_preset: sanitizedPresetId,
        avatar_frame_color: frameColor,
        banner_preset: sanitizedBannerId,
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
          avatar_url: customAvatarUrl || null,
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
      <div className="relative overflow-visible pt-10 sm:pt-14">
        {/* Banner Artwork Canvas - Frameless & Popping with zero border cutting through */}
        <div className="relative overflow-visible z-10">
          <div
            className={`relative h-56 sm:h-72 w-full overflow-visible transition-all ${
              activeBannerTheme.isAdminOnly
                ? 'rounded-3xl bg-gradient-to-r ' + activeBannerTheme.gradient + ' shadow-[0_10px_40px_rgba(0,0,0,0.7)]'
                : 'rounded-3xl bg-gradient-to-r ' + activeBannerTheme.gradient + ' shadow-2xl'
            }`}
          >
            {/* If Exclusive Admin Banner: Japanese Dragon / Domain Expansion bursting out */}
            {activeBannerTheme.isAdminOnly ? (
              <AdminDragonBanner themeId={activeBannerTheme.id} />
            ) : (
              <NormalBannerArt themeId={activeBannerTheme.id} />
            )}

            {/* Subtle atmospheric ambient glow - frameless */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none rounded-3xl" />
            <div
              className={`absolute inset-0 pointer-events-none rounded-3xl ${
                activeBannerTheme.isAdminOnly
                  ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent'
                  : 'bg-gradient-to-t from-black/85 via-black/25 to-transparent'
              }`}
            />

            {/* Quick Banner Switcher button */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveProfileTab('edit')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
                title="Customize banner & theme"
              >
                <Palette className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Theme:</span>
                <span className="text-rose-300">{activeBannerTheme.name}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details Header Card - Seamless blend with zero cut-off, always on top */}
        <div
          className={`relative rounded-3xl px-6 sm:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8 -mt-12 sm:-mt-16 z-30 backdrop-blur-md shadow-2xl transition-colors ${
            activeBannerTheme.isAdminOnly
              ? 'bg-white/95 dark:bg-[#0e111a]/95 border-x border-b border-t-0 border-slate-200/60 dark:border-[#1e2333]/70'
              : 'bg-white/95 dark:bg-[#10131d]/95 border border-slate-200/90 dark:border-[#222838]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Anime Avatar with Exclusive Frame & Edit overlay */}
              <div className="relative group">
                <AnimeAvatar
                  presetId={activeAvatarPreset.id}
                  customAvatarUrl={customAvatarUrl || currentUser.avatar_url || undefined}
                  frameColor={frameColor}
                  size="2xl"
                  isAdmin={isAdmin}
                  isDonor={isDonor}
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
                  className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 z-20 shadow-md"
                  title="Active"
                />
              </div>

              {/* Names, Handle & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1
                    className={`text-2xl sm:text-3xl font-display font-black tracking-tight ${
                      isAdmin
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-100 dark:via-yellow-300 dark:to-amber-200 bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_2px_14px_rgba(245,158,11,0.6)]'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {displayName || currentUser.username}
                  </h1>
                  {isAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-400/60 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 fill-amber-400/40" />
                      Sovereign Admin
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                      Member
                    </span>
                  )}
                  {isDonor && (
                    <span
                      className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-rose-500/20 via-pink-500/25 to-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/50 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-default"
                      title="KuroShelf Generous Donator ❤️ Thank you so much for your donation!"
                    >
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
                      Donator
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="text-slate-500 dark:text-neutral-400 font-medium">@{username || currentUser.username}</span>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 ${rank.titleBadgeColor}`}>
                    <Trophy className="w-3 h-3" />
                    <span>Level {rank.level}</span>
                    <span className="opacity-80">({rank.title})</span>
                  </span>
                </div>

                {/* Social Followers & Following Counters */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSocialModalOpen('following')}
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 font-mono text-xs">
                      {followData.following.length}
                    </span>
                    <span className="text-slate-500 dark:text-neutral-400 text-xs">Following</span>
                  </button>

                  <span className="text-slate-300 dark:text-neutral-700">•</span>

                  <button
                    type="button"
                    onClick={() => setSocialModalOpen('followers')}
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 font-mono text-xs">
                      {followData.followers.length}
                    </span>
                    <span className="text-slate-500 dark:text-neutral-400 text-xs">Followers</span>
                  </button>

                  {gender && (
                    <>
                      <span className="text-slate-300 dark:text-neutral-700">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/60 text-[11px] font-medium text-slate-600 dark:text-neutral-300">
                        {gender}
                      </span>
                    </>
                  )}
                </div>

                {/* Status message */}
                {statusMessage && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 italic max-w-md pt-0.5">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-all cursor-pointer shadow-xs"
                title="Copy profile card text"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                    <span>Share Card</span>
                  </>
                )}
              </button>

              {onOpenAccountSwitcher && (
                <button
                  type="button"
                  id="profile-switch-account-button"
                  onClick={onOpenAccountSwitcher}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-all cursor-pointer shadow-xs"
                  title={`Switch Account (${savedAccountsCount} logged in)`}
                >
                  <Users className="w-3.5 h-3.5 text-rose-500" />
                  <span>Switch Account</span>
                  {savedAccountsCount > 1 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px] font-bold">
                      {savedAccountsCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveProfileTab('edit')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/20 transition-all cursor-pointer"
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
                className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800/90 dark:hover:bg-red-950/60 dark:hover:text-red-400 border border-slate-200 dark:border-neutral-700/80 text-slate-500 dark:text-neutral-400 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Library Milestones & Watch Activity */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-neutral-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Library Milestones & Watch Activity</span>
              </span>
              <span className="text-slate-600 dark:text-neutral-300 font-mono text-[11px]">
                {rank.currentProgressXp} / 100 XP to <strong className="text-slate-900 dark:text-white">Level {rank.level + 1}</strong>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-neutral-950 overflow-hidden border border-slate-200 dark:border-neutral-800">
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
          {/* Daily Streak Widget */}
          {streakInfo && onStreakUpdated && (
            <DailyStreakWidget
              userId={currentUser.id}
              streakInfo={streakInfo}
              onStreakUpdated={onStreakUpdated}
              compact={false}
            />
          )}

          {/* Sub-Navigation Bar for Otaku Profile (MAL-style tabs) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-neutral-800 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowcaseSubTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showcaseSubTab === 'overview'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Shelf Statistics</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowcaseSubTab('animelist');
                  setListStatusFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showcaseSubTab === 'animelist'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Anime List</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  showcaseSubTab === 'animelist' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300'
                }`}>
                  {animeStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowcaseSubTab('mangalist');
                  setListStatusFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showcaseSubTab === 'mangalist'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Manga List</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  showcaseSubTab === 'mangalist' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300'
                }`}>
                  {mangaStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowcaseSubTab('spotlight')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showcaseSubTab === 'spotlight'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Spotlight ({pinnedItems.length}/4)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowcaseSubTab('milestones')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showcaseSubTab === 'milestones'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Milestones ({badges.filter(b => b.unlocked).length})</span>
              </button>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('shelf')}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Shelf Manager</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* SUB-VIEW 1: OVERVIEW & MAL STATISTICS */}
          {showcaseSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Dual-Column MAL Anime Stats & Manga Stats Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. ANIME STATS (MAL Style) */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e263d] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                        <Play className="w-4 h-4 fill-blue-500/20" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white font-mono">
                          Anime Stats
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Watch time & catalog completion
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Days Watched</span>
                        <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {animeStats.daysWatched} <span className="text-xs text-slate-400 font-normal">days</span>
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-[#1e263d]" />
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Mean Score</span>
                        <span className="text-base font-black text-amber-500 dark:text-amber-400 font-mono flex items-center gap-1 justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {animeStats.meanScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MAL Segmented Color Bar */}
                  <div className="space-y-2">
                    <div className="w-full h-3.5 rounded-md bg-slate-100 dark:bg-[#090c14] overflow-hidden flex gap-0.5 p-0.5 border border-slate-200 dark:border-[#1e263d]">
                      {animeStats.total > 0 ? (
                        <>
                          {animeStats.watching > 0 && (
                            <div
                              className="h-full bg-[#2db039] rounded-xs transition-all"
                              style={{ width: `${(animeStats.watching / animeStats.total) * 100}%` }}
                              title={`Watching: ${animeStats.watching}`}
                            />
                          )}
                          {animeStats.completed > 0 && (
                            <div
                              className="h-full bg-[#26448f] dark:bg-[#3b82f6] rounded-xs transition-all"
                              style={{ width: `${(animeStats.completed / animeStats.total) * 100}%` }}
                              title={`Completed: ${animeStats.completed}`}
                            />
                          )}
                          {animeStats.onHold > 0 && (
                            <div
                              className="h-full bg-[#f1a80a] rounded-xs transition-all"
                              style={{ width: `${(animeStats.onHold / animeStats.total) * 100}%` }}
                              title={`On-Hold: ${animeStats.onHold}`}
                            />
                          )}
                          {animeStats.dropped > 0 && (
                            <div
                              className="h-full bg-[#a12f31] dark:bg-[#e11d48] rounded-xs transition-all"
                              style={{ width: `${(animeStats.dropped / animeStats.total) * 100}%` }}
                              title={`Dropped: ${animeStats.dropped}`}
                            />
                          )}
                          {animeStats.plan > 0 && (
                            <div
                              className="h-full bg-[#64748b] rounded-xs transition-all"
                              style={{ width: `${(animeStats.plan / animeStats.total) * 100}%` }}
                              title={`Plan to Watch: ${animeStats.plan}`}
                            />
                          )}
                        </>
                      ) : (
                        <div className="h-full w-full bg-slate-200 dark:bg-[#1a2030] rounded-xs" />
                      )}
                    </div>

                    {/* Legend with exact MAL status tags */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 pt-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2db039]" />
                          <span>Watching</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{animeStats.watching}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#26448f] dark:bg-[#3b82f6]" />
                          <span>Completed</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{animeStats.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f1a80a]" />
                          <span>On-Hold</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{animeStats.onHold}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#a12f31] dark:bg-[#e11d48]" />
                          <span>Dropped</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{animeStats.dropped}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                          <span>Plan to Watch</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{animeStats.plan}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Entries</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{animeStats.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-metrics */}
                  <div className="pt-3 border-t border-slate-100 dark:border-[#1e263d] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Episodes Watched: <strong className="text-slate-800 dark:text-slate-200 font-mono">{animeStats.totalEpisodes}</strong></span>
                    <span>Scored Titles: <strong className="text-slate-800 dark:text-slate-200 font-mono">{animeStats.ratedCount}</strong></span>
                  </div>
                </div>

                {/* 2. MANGA STATS (MAL Style) */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e263d] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
                        <BookOpen className="w-4 h-4 fill-purple-500/20" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white font-mono">
                          Manga Stats
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Reading progression & volumes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Days Read</span>
                        <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {mangaStats.daysRead} <span className="text-xs text-slate-400 font-normal">days</span>
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-[#1e263d]" />
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Mean Score</span>
                        <span className="text-base font-black text-amber-500 dark:text-amber-400 font-mono flex items-center gap-1 justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {mangaStats.meanScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MAL Segmented Color Bar for Manga */}
                  <div className="space-y-2">
                    <div className="w-full h-3.5 rounded-md bg-slate-100 dark:bg-[#090c14] overflow-hidden flex gap-0.5 p-0.5 border border-slate-200 dark:border-[#1e263d]">
                      {mangaStats.total > 0 ? (
                        <>
                          {mangaStats.reading > 0 && (
                            <div
                              className="h-full bg-[#2db039] rounded-xs transition-all"
                              style={{ width: `${(mangaStats.reading / mangaStats.total) * 100}%` }}
                              title={`Reading: ${mangaStats.reading}`}
                            />
                          )}
                          {mangaStats.completed > 0 && (
                            <div
                              className="h-full bg-[#26448f] dark:bg-[#3b82f6] rounded-xs transition-all"
                              style={{ width: `${(mangaStats.completed / mangaStats.total) * 100}%` }}
                              title={`Completed: ${mangaStats.completed}`}
                            />
                          )}
                          {mangaStats.onHold > 0 && (
                            <div
                              className="h-full bg-[#f1a80a] rounded-xs transition-all"
                              style={{ width: `${(mangaStats.onHold / mangaStats.total) * 100}%` }}
                              title={`On-Hold: ${mangaStats.onHold}`}
                            />
                          )}
                          {mangaStats.dropped > 0 && (
                            <div
                              className="h-full bg-[#a12f31] dark:bg-[#e11d48] rounded-xs transition-all"
                              style={{ width: `${(mangaStats.dropped / mangaStats.total) * 100}%` }}
                              title={`Dropped: ${mangaStats.dropped}`}
                            />
                          )}
                          {mangaStats.plan > 0 && (
                            <div
                              className="h-full bg-[#64748b] rounded-xs transition-all"
                              style={{ width: `${(mangaStats.plan / mangaStats.total) * 100}%` }}
                              title={`Plan to Read: ${mangaStats.plan}`}
                            />
                          )}
                        </>
                      ) : (
                        <div className="h-full w-full bg-slate-200 dark:bg-[#1a2030] rounded-xs" />
                      )}
                    </div>

                    {/* Legend with exact MAL status tags */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 pt-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2db039]" />
                          <span>Reading</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{mangaStats.reading}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#26448f] dark:bg-[#3b82f6]" />
                          <span>Completed</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{mangaStats.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f1a80a]" />
                          <span>On-Hold</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{mangaStats.onHold}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#a12f31] dark:bg-[#e11d48]" />
                          <span>Dropped</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{mangaStats.dropped}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                          <span>Plan to Read</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{mangaStats.plan}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Entries</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{mangaStats.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-metrics */}
                  <div className="pt-3 border-t border-slate-100 dark:border-[#1e263d] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Chapters Read: <strong className="text-slate-800 dark:text-slate-200 font-mono">{mangaStats.totalChapters}</strong></span>
                    <span>Scored Titles: <strong className="text-slate-800 dark:text-slate-200 font-mono">{mangaStats.ratedCount}</strong></span>
                  </div>
                </div>
              </div>

              {/* Authentic MAL Score Distribution Histogram (10 to 1) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e263d] pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white font-mono">
                      Score Distribution
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {scoreDistribution.totalRated} Scored Titles
                  </span>
                </div>

                {scoreDistribution.totalRated > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {scoreDistribution.distribution.map((item) => (
                      <div key={item.score} className="flex items-center gap-3 text-xs">
                        <div className="w-28 sm:w-36 flex items-center justify-between shrink-0 font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {item.score}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans truncate mr-2">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex-1 h-3 rounded-sm bg-slate-100 dark:bg-[#090c14] overflow-hidden border border-slate-200 dark:border-[#1e263d]">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xs transition-all duration-500"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        <div className="w-16 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400 shrink-0">
                          <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({item.percent}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                    Rate anime or manga on your shelf to populate your authentic score distribution curve!
                  </div>
                )}
              </div>

              {/* Spotlight Highlights (Top 4 Favorites) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Spotlight Highlights ({pinnedItems.length}/4)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPinSelectorOpen(true)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Change Spotlight
                  </button>
                </div>

                {pinnedItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {pinnedItems.map((item, idx) => (
                      <div
                        key={`pinned-${item.id}`}
                        onClick={() => {
                          if (item.mediaType === 'manga' && onSelectManga) {
                            onSelectManga(item.title);
                          } else if (onSelectAnime) {
                            onSelectAnime({ mal_id: item.id, title: item.title, images: { jpg: { large_image_url: item.image } } });
                          }
                        }}
                        className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] hover:border-rose-500/60 dark:hover:border-rose-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden relative">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                          {/* Ranking Badge */}
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-mono text-[10px] font-black tracking-wider">
                            #{idx + 1}
                          </div>

                          {/* Direct Unpin action button */}
                          <button
                            type="button"
                            onClick={(e) => handleUnpinSpotlight(e, item.id)}
                            title="Unpin from spotlight"
                            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {item.userRating && (
                            <div className="absolute bottom-10 left-2 px-2 py-0.5 rounded-lg bg-black/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{item.userRating}/10</span>
                            </div>
                          )}

                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="px-1.5 py-0.5 rounded-sm bg-slate-800/90 text-slate-200 text-[9px] font-bold uppercase tracking-wider">
                              {item.mediaType === 'manga' ? 'Manga' : 'Anime'} • {item.status.replace('_', ' ')}
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
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#0f1422] border border-dashed border-slate-300 dark:border-[#1e263d] text-center space-y-2">
                    <Bookmark className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Your spotlight is currently empty.
                    </p>
                    <p className="text-xs text-slate-500">
                      Add titles to your shelf, then pin your top 4 all-time favorites!
                    </p>
                  </div>
                )}
              </div>

              {/* About Me & Quote Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 font-mono">
                      About Me
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {bio || 'No biography written yet. Click "Customize Identity" above to introduce yourself to fellow fans!'}
                    </p>
                  </div>

                  {favoriteQuote && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-[#1e263d] flex items-start gap-3">
                      <span className="text-rose-500 dark:text-rose-400 text-xl font-serif leading-none">“</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                        {favoriteQuote}
                      </p>
                    </div>
                  )}

                  {/* Favorite Genres Chips */}
                  {favoriteGenres.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-2">Favorite Genres</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {favoriteGenres.map((genre) => (
                          <span
                            key={genre}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#090c14] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e263d] text-xs font-medium"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Social & Identity Meta */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                    Connected Handles
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-[#1e263d]">
                      <span className="text-slate-500 dark:text-slate-400">Discord</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                        {socialDiscord || 'Not set'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-[#1e263d]">
                      <span className="text-slate-500 dark:text-slate-400">Community Handle</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                        {socialAnilist || 'Not set'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-[#1e263d]">
                      <span className="text-slate-500 dark:text-slate-400">External Profile</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                        {socialMal || 'Not set'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-[#1e263d]">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      Member since {new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: ANIME LIST (Authentic MAL Interactive Table) */}
          {showcaseSubTab === 'animelist' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setListStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        listStatusFilter === st
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-[#090c14] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2030]'
                      }`}
                    >
                      {st === 'all' ? 'All Anime' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search in anime list..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-[#1e263d] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* MAL Anime Table */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1e263d] bg-white dark:bg-[#0f1422] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#090c14] border-b border-slate-200 dark:border-[#1e263d] text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-2 w-16">Cover</th>
                        <th className="py-3 px-4">Anime Title</th>
                        <th className="py-3 px-4 w-28 text-center">Score</th>
                        <th className="py-3 px-4 w-32">Status</th>
                        <th className="py-3 px-4 w-28 text-center">Progress</th>
                        <th className="py-3 px-4 w-24 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e263d]">
                      {filteredAnimeList.length > 0 ? (
                        filteredAnimeList.map((entry, idx) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50 dark:hover:bg-[#131a2d] transition-colors"
                          >
                            <td className="py-3 px-4 text-center font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-2">
                              <img
                                src={entry.image}
                                alt={entry.title}
                                className="w-10 h-14 object-cover rounded-md border border-slate-200 dark:border-[#1e263d]"
                                loading="lazy"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectAnime) {
                                    onSelectAnime({ mal_id: entry.id, title: entry.title, images: { jpg: { large_image_url: entry.image } } });
                                  }
                                }}
                                className="font-bold text-slate-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 text-left transition-colors cursor-pointer"
                              >
                                {entry.title}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {entry.userRating ? (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {entry.userRating}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                entry.status === 'watching' ? 'bg-[#2db039]/10 text-[#2db039] border border-[#2db039]/30' :
                                entry.status === 'completed' ? 'bg-[#26448f]/10 text-blue-500 border border-blue-500/30' :
                                entry.status === 'on_hold' ? 'bg-[#f1a80a]/10 text-amber-500 border border-amber-500/30' :
                                entry.status === 'dropped' ? 'bg-[#a12f31]/10 text-rose-500 border border-rose-500/30' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {entry.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                              {entry.progress || 0} / {entry.totalUnits || '?'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectAnime) {
                                    onSelectAnime({ mal_id: entry.id, title: entry.title, images: { jpg: { large_image_url: entry.image } } });
                                  }
                                }}
                                className="px-2 py-1 rounded-md bg-slate-100 dark:bg-[#090c14] hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No anime matching your filter in this list.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: MANGA LIST (Authentic MAL Interactive Table) */}
          {showcaseSubTab === 'mangalist' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setListStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        listStatusFilter === st
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-[#090c14] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2030]'
                      }`}
                    >
                      {st === 'all' ? 'All Manga' : st === 'watching' ? 'Reading' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search in manga list..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-[#1e263d] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* MAL Manga Table */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1e263d] bg-white dark:bg-[#0f1422] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#090c14] border-b border-slate-200 dark:border-[#1e263d] text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-2 w-16">Cover</th>
                        <th className="py-3 px-4">Manga Title</th>
                        <th className="py-3 px-4 w-28 text-center">Score</th>
                        <th className="py-3 px-4 w-32">Status</th>
                        <th className="py-3 px-4 w-28 text-center">Progress</th>
                        <th className="py-3 px-4 w-24 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e263d]">
                      {filteredMangaList.length > 0 ? (
                        filteredMangaList.map((entry, idx) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50 dark:hover:bg-[#131a2d] transition-colors"
                          >
                            <td className="py-3 px-4 text-center font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-2">
                              <img
                                src={entry.image}
                                alt={entry.title}
                                className="w-10 h-14 object-cover rounded-md border border-slate-200 dark:border-[#1e263d]"
                                loading="lazy"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectManga) {
                                    onSelectManga(entry.title);
                                  }
                                }}
                                className="font-bold text-slate-900 dark:text-white hover:text-purple-500 dark:hover:text-purple-400 text-left transition-colors cursor-pointer"
                              >
                                {entry.title}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {entry.userRating ? (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {entry.userRating}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                entry.status === 'watching' ? 'bg-[#2db039]/10 text-[#2db039] border border-[#2db039]/30' :
                                entry.status === 'completed' ? 'bg-[#26448f]/10 text-blue-500 border border-blue-500/30' :
                                entry.status === 'on_hold' ? 'bg-[#f1a80a]/10 text-amber-500 border border-amber-500/30' :
                                entry.status === 'dropped' ? 'bg-[#a12f31]/10 text-rose-500 border border-rose-500/30' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {entry.status === 'watching' ? 'reading' : entry.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                              {entry.progress || 0} / {entry.totalUnits || '?'} ch
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectManga) {
                                    onSelectManga(entry.title);
                                  }
                                }}
                                className="px-2 py-1 rounded-md bg-slate-100 dark:bg-[#090c14] hover:bg-purple-600 hover:text-white text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No manga matching your filter in this list.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: SPOTLIGHT FAVORITES */}
          {showcaseSubTab === 'spotlight' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Spotlight Highlights ({pinnedItems.length}/4)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPinSelectorOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Configure Spotlight
                </button>
              </div>

              {pinnedItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {pinnedItems.map((item, idx) => (
                    <div
                      key={`pinned-sub-${item.id}`}
                      onClick={() => {
                        if (item.mediaType === 'manga' && onSelectManga) {
                          onSelectManga(item.title);
                        } else if (onSelectAnime) {
                          onSelectAnime({ mal_id: item.id, title: item.title, images: { jpg: { large_image_url: item.image } } });
                        }
                      }}
                      className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1e263d] hover:border-rose-500/60 dark:hover:border-rose-500/60 transition-all cursor-pointer shadow-md"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[10px] font-black">
                          #{idx + 1}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleUnpinSpotlight(e, item.id)}
                          title="Unpin from spotlight"
                          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {item.userRating && (
                          <div className="absolute bottom-10 left-2 px-2 py-0.5 rounded-lg bg-black/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.userRating}/10</span>
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-800/90 text-slate-200 text-[9px] font-bold uppercase tracking-wider">
                            {item.mediaType === 'manga' ? 'Manga' : 'Anime'} • {item.status.replace('_', ' ')}
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
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 5: CURATOR MILESTONES */}
          {showcaseSubTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Curator Milestones & Achievements ({badges.filter((b) => b.unlocked).length}/{badges.length})
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
          )}
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
                    { id: 'none', name: 'None (Default)', bg: 'bg-neutral-600' },
                    { id: 'simple_blurple', name: 'Blurple', bg: 'bg-[#5865f2]' },
                    { id: 'simple_emerald', name: 'Green', bg: 'bg-[#57f287]' },
                    { id: 'simple_ruby', name: 'Red', bg: 'bg-[#ed4245]' },
                    { id: 'simple_amber', name: 'Yellow', bg: 'bg-[#fee75c]' },
                    { id: 'simple_fuchsia', name: 'Pink', bg: 'bg-[#eb459e]' },
                    { id: 'simple_cyan', name: 'Mint / Cyan', bg: 'bg-[#23a55a]' }
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

                {/* Exclusive Admin Avatar Frames (Exactly 5 for Admin) */}
                {isAdmin && (
                  <div className="pt-3 mt-3 border-t border-neutral-800/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Exclusive Sovereign Frames (5 Max)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {[
                        { id: 'dragon_gold', name: 'Imperial Dragon (Gold Crown & Claws)' },
                        { id: 'shadow_arise', name: 'Shadow Monarch (Necrotic Flame)' },
                        { id: 'infinity_void', name: 'Limitless Void (Rotating Ring)' },
                        { id: 'sun_god_flame', name: 'Sun God (Solar Corona Flare)' },
                        { id: 'susanoo_chakra', name: 'Perfect Susanoo (Chakra Crown)' }
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

              {/* Custom Photo Upload with Automated Content Safety Guard */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-rose-400" />
                      <span>Custom Profile Photo (Gallery / Device Upload)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        Automated Guard
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xl">
                      Upload your desired photo directly from your gallery or computer. Every upload is automatically scanned by our local safety guard to ensure an explicit-free anime community.
                    </p>
                  </div>

                  {customAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveCustomAvatar}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/50 hover:text-red-300 border border-neutral-800 hover:border-red-900/60 text-xs font-semibold text-neutral-300 transition-colors shrink-0 cursor-pointer"
                      title="Remove custom photo and use an anime preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revert to Anime Preset</span>
                    </button>
                  )}
                </div>

                {/* Live Preview & File Picker Area */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Avatar Frame Live Preview */}
                  <div className="flex items-center gap-3.5 shrink-0 bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800/80">
                    <div className="relative">
                      <AnimeAvatar
                        presetId={selectedPresetId}
                        customAvatarUrl={customAvatarUrl}
                        frameColor={frameColor}
                        size="xl"
                        isAdmin={isAdmin}
                      />
                      {customAvatarUrl && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold shadow-md">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-left space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{customAvatarUrl ? 'Custom Photo Active' : 'Anime Preset Active'}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {customAvatarUrl ? 'Gallery photo framed' : `Preset: ${selectedPresetId}`}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Frame: <span className="capitalize text-neutral-300">{frameColor.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Trigger */}
                  <div className="flex-1 w-full space-y-2">
                    <label
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed text-xs font-semibold cursor-pointer transition-all text-center ${
                        avatarScanning
                          ? 'bg-rose-950/20 border-rose-500/50 text-neutral-300 cursor-not-allowed'
                          : 'bg-neutral-900/70 hover:bg-neutral-900 border-neutral-700/80 hover:border-rose-500 text-neutral-200 hover:text-white group'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleAvatarFileChange}
                        disabled={avatarScanning}
                        className="sr-only"
                      />
                      {avatarScanning ? (
                        <>
                          <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-xs block">
                              Automated Safety Guard is scanning your image...
                            </span>
                            <span className="text-[11px] text-neutral-400 block">
                              Checking against nudity, explicit, or violent material
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2.5 rounded-xl bg-neutral-800 group-hover:bg-rose-500/20 text-neutral-300 group-hover:text-rose-400 transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block">
                              Choose Photo from Gallery / Device
                            </span>
                            <span className="text-[11px] text-neutral-400 block mt-0.5">
                              JPEG, PNG, WEBP up to 8MB • Auto-cropped to square avatar
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Moderation Scan Outcome Notice */}
                {avatarScanResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in duration-300 ${
                      avatarScanResult.safe
                        ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200 shadow-sm'
                        : 'bg-red-950/50 border-red-800/80 text-red-200 shadow-lg shadow-red-950/30'
                    }`}
                  >
                    {avatarScanResult.safe ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold text-xs">
                        {avatarScanResult.safe
                          ? 'Community Safety Guard Approved'
                          : 'Image Blocked by AI Safety Guard'}
                      </p>
                      <p className="opacity-95 leading-relaxed text-[11px]">
                        {avatarScanResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {avatarUploadError && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{avatarUploadError}</span>
                  </div>
                )}
              </div>

              {/* Sovereign Exclusive Avatars (Only visible to Admins) */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-amber-950/40 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Sovereign Administrator Exclusive Avatars
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 ml-auto">
                      Admin Only
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Handcrafted, mature sovereign avatars (Kuro-Ryu Sovereign, Shadow Monarch, Limitless Awakened, Blood Moon Ronin, and Celestial Susanoo Tengu) reserved exclusively for Admins (5 Max).
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                    {AVATAR_PRESETS.filter((p) => p.isAdminOnly).map((preset) => {
                      const isSelected = selectedPresetId === preset.id && !customAvatarUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedPresetId(preset.id);
                            setCustomAvatarUrl(null);
                            setAvatarScanResult(null);
                          }}
                          className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/60 border-amber-400 shadow-xl shadow-amber-950/50 ring-2 ring-amber-400/80 scale-[1.04]'
                              : 'bg-neutral-950/80 border-amber-500/30 hover:border-amber-400/70'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg flex items-center justify-center">
                            <AnimeAvatar presetId={preset.id} frameColor="dragon_gold" size="lg" />
                          </div>
                          <div className="text-center w-full">
                            <h5 className="text-xs font-extrabold text-amber-200 truncate">{preset.name}</h5>
                            <span className="text-[10px] text-amber-400/80 font-medium">{preset.badge}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Curated Mature Anime & Manga Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Curated Anime & Manga Vector Presets</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px] font-semibold border border-rose-500/20">Kuro Shelf Original</span>
                    </label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">High-contrast, mature vector illustrations crafted for manga & anime curators.</p>
                  </div>
                  {customAvatarUrl && (
                    <span className="text-[11px] text-neutral-400 hidden sm:inline">
                      Selecting a preset will switch from your custom photo.
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 pt-1">
                  {AVATAR_PRESETS.filter((p) => !p.isAdminOnly).map((preset) => {
                    const isSelected = selectedPresetId === preset.id && !customAvatarUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetId(preset.id);
                          setCustomAvatarUrl(null);
                          setAvatarScanResult(null);
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 border-rose-500 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/50 scale-[1.02]'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden shadow-md flex items-center justify-center">
                          <AnimeAvatar presetId={preset.id} frameColor="none" size="lg" />
                        </div>
                        <div className="text-center w-full">
                          <h5 className="text-xs font-bold text-white truncate">{preset.name}</h5>
                          <span className="text-[10px] text-rose-300/80 font-medium">{preset.category}</span>
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
                      Sovereign Administrator Banners (5 Max — With Frame Breakout Effect)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 ml-auto">
                      Admin Only
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    High-visual interactive banners designed to dramatically break out of the profile banner frame for a sovereign feel.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
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

              {/* Atmospheric & Mature Standard Themes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 block">
                    Atmospheric & Mature Dark Banners
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    Subtle, minimalist, aesthetic themes
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {BANNER_THEMES.filter((t) => !t.isAdminOnly).map((theme) => {
                    const isSelected = selectedBannerId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedBannerId(theme.id)}
                        className={`h-28 rounded-2xl p-4 flex flex-col justify-between text-left border relative overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white shadow-xl ring-2 ring-rose-500 scale-[1.02]'
                            : 'border-neutral-800 hover:border-neutral-700'
                        } bg-gradient-to-r ${theme.gradient}`}
                      >
                        {/* NormalBannerArt preview in background */}
                        <NormalBannerArt themeId={theme.id} />
                        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
                        <div className="relative z-10 flex justify-end">
                          {isSelected && (
                            <span className="p-1 rounded-full bg-rose-500 text-white shadow-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="relative z-10">
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{theme.name}</span>
                          </h5>
                          <p className="text-[10px] text-neutral-300/80 mt-0.5 line-clamp-2 leading-tight">{theme.tagline}</p>
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
                  <label className="text-xs font-medium text-neutral-400">Community Social Handle</label>
                  <input
                    type="text"
                    value={socialAnilist}
                    onChange={(e) => setSocialAnilist(e.target.value)}
                    placeholder="e.g. otaku_samurai"
                    maxLength={40}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">External Profile Link / Username</label>
                  <input
                    type="text"
                    value={socialMal}
                    onChange={(e) => setSocialMal(e.target.value)}
                    placeholder="e.g. your_profile_tag"
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

          {/* Google Drive Cloud Backup */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-neutral-300">
                <Cloud className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Google Drive Cloud Backup
                </h3>
              </div>
              {isGoogleDriveConnected() && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              Safely store snapshot backups of your anime and manga shelves directly in your Google Drive cloud account. You can restore or export your library at any time.
            </p>

            {driveStatusMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  driveStatusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <span>{driveStatusMsg.message}</span>
                <button
                  type="button"
                  onClick={() => setDriveStatusMsg(null)}
                  className="text-neutral-500 hover:text-neutral-300 text-xs px-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDriveBackupFromProfile}
                disabled={driveSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-900/30 transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>{driveSyncing ? 'Backing up to Drive...' : 'Backup Shelf to Google Drive'}</span>
              </button>

              {onOpenImportExport && (
                <button
                  type="button"
                  onClick={onOpenImportExport}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-neutral-400" />
                  <span>Manage Drive Backups & Restores</span>
                </button>
              )}

              {isGoogleDriveConnected() && (
                <button
                  type="button"
                  onClick={() => {
                    disconnectGoogleDrive();
                    setDriveStatusMsg({ type: 'success', message: 'Google Drive disconnected.' });
                  }}
                  className="px-3 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Disconnect Drive
                </button>
              )}
            </div>
          </div>

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
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 space-y-4 shadow-2xl">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSocialModalOpen('following');
                    setSocialSearch('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    socialModalOpen === 'following'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  Following ({followData.following.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSocialModalOpen('followers');
                    setSocialSearch('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    socialModalOpen === 'followers'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  Followers ({followData.followers.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSocialModalOpen(null);
                  setSocialSearch('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
              <input
                type="text"
                value={socialSearch}
                onChange={(e) => setSocialSearch(e.target.value)}
                placeholder="Search by name or @username..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs text-slate-800 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-hidden focus:border-rose-500 transition-colors"
              />
            </div>

            {/* List of Users */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {socialModalOpen === 'following' ? (
                followData.following.length > 0 ? (
                  INITIAL_COMMUNITY_USERS.filter((u) => {
                    if (!followData.following.includes(u.id)) return false;
                    const q = socialSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      u.display_name.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q)
                    );
                  }).map((u) => {
                    const userIsAdmin = isAdminUser(u);
                    return (
                      <div
                        key={`following-${u.id}`}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/80 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-neutral-700 transition-all"
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
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-200 dark:via-yellow-300 dark:to-amber-400 bg-clip-text text-transparent font-black drop-shadow-xs'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {u.display_name}
                              </h4>
                              {userIsAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-xs">
                                  <Crown className="w-2.5 h-2.5 text-amber-500" /> Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                              <span className={userIsAdmin ? 'text-amber-600 dark:text-amber-300/90 font-mono font-bold' : ''}>
                                @{u.username}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400 dark:text-neutral-500">{u.levelTitle || 'Member'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-900/60 border border-slate-300 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-all cursor-pointer shrink-0"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Following</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-xs">
                    You are not following any members yet.
                  </div>
                )
              ) : (
                followData.followers.length > 0 ? (
                  INITIAL_COMMUNITY_USERS.filter((u) => {
                    if (!followData.followers.includes(u.id)) return false;
                    const q = socialSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      u.display_name.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q)
                    );
                  }).map((u) => {
                    const isFollowingBack = followData.following.includes(u.id);
                    const userIsAdmin = isAdminUser(u);
                    return (
                      <div
                        key={`follower-${u.id}`}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/80 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-neutral-700 transition-all"
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
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-200 dark:via-yellow-300 dark:to-amber-400 bg-clip-text text-transparent font-black drop-shadow-xs'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {u.display_name}
                              </h4>
                              {userIsAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-xs">
                                  <Crown className="w-2.5 h-2.5 text-amber-500" /> Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                              <span className={userIsAdmin ? 'text-amber-600 dark:text-amber-300/90 font-mono font-bold' : ''}>
                                @{u.username}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400 dark:text-neutral-500">{u.levelTitle || 'Member'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(u.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                            isFollowingBack
                              ? 'bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-neutral-700'
                              : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm'
                          }`}
                        >
                          {isFollowingBack ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
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
                  <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-xs">
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
