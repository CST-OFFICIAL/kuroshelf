export type NoticeCategory = 'announcement' | 'update' | 'maintenance' | 'community' | 'event';

export interface PlatformNotice {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: NoticeCategory;
  createdAt: string; // ISO date string
  authorName: string;
  isPinned?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  externalLink?: string;
}

const STORAGE_KEY = 'kuroshelf_announcements';
const LAST_READ_KEY = 'kuroshelf_announcements_last_read';

// Official KuroShelf System Notices
const DEFAULT_NOTICES: PlatformNotice[] = [
  {
    id: 'notice-welcome',
    title: 'Welcome to KuroShelf: Anime & Manga Discovery',
    summary: 'Explore 25,000+ anime & manga titles with ultra-fast search and custom shelves.',
    content: 'KuroShelf is built for anime & manga enthusiasts to discover, track, and catalog series without intrusive ads. Organize your personal shelves into Watching, Plan to Watch, Completed, and On Hold, with instant score filtering and season browsing.',
    category: 'announcement',
    createdAt: '2026-09-20T10:00:00Z',
    authorName: 'KuroShelf Team',
    isPinned: true,
    priority: 'high',
  },
  {
    id: 'notice-polls-live',
    title: 'Prediction Polls System is Now Live',
    summary: 'Vote on plot predictions, character survival, and upcoming season reveals.',
    content: 'The KuroShelf Community Prediction Polls feature is active! Standard accounts can create 1 poll per week, while KuroClub VIP members can launch up to 7 prediction polls each week. All community members can vote and participate in unlimited open polls.',
    category: 'update',
    createdAt: '2026-09-21T14:30:00Z',
    authorName: 'KuroShelf Devs',
    isPinned: true,
    priority: 'normal',
  },
  {
    id: 'notice-manga-shelf',
    title: 'Manga & Light Novel Catalog Integration',
    summary: 'Track volume releases, chapter counts, and find official reading links.',
    content: 'Our manga section now displays detailed publication status, serialization magazines, volume listings, and direct Amazon purchase links. You can also track your reading progress separately from anime.',
    category: 'update',
    createdAt: '2026-09-18T08:00:00Z',
    authorName: 'KuroShelf Devs',
  },
  {
    id: 'notice-community-fund',
    title: 'Community Fund & Server Infrastructure',
    summary: '100% of user donations fund server bandwidth, database maintenance, and catalog caching.',
    content: 'KuroShelf operates as an independent community project. Every contribution directly powers our high-speed catalog cache, database hosting, and community features. We are deeply grateful to everyone helping us grow!',
    category: 'community',
    createdAt: '2026-09-15T12:00:00Z',
    authorName: 'KuroShelf Core',
    priority: 'normal',
  },
];

export function getAnnouncements(): PlatformNotice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTICES));
      return DEFAULT_NOTICES;
    }
    const parsed: PlatformNotice[] = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn('[Announcements] Failed to read from localStorage:', err);
    return DEFAULT_NOTICES;
  }
}

export function getAnnouncement(id: string): PlatformNotice | undefined {
  const list = getAnnouncements();
  return list.find((n) => n.id === id);
}

export function createAnnouncement(
  noticeData: Omit<PlatformNotice, 'id' | 'createdAt'>
): PlatformNotice {
  const current = getAnnouncements();
  const newNotice: PlatformNotice = {
    ...noticeData,
    id: `notice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newNotice, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('kuroshelf_announcements_updated', { detail: newNotice }));
  } catch (err) {
    console.warn('[Announcements] Failed to save announcement:', err);
  }
  return newNotice;
}

export function updateAnnouncement(
  id: string,
  updates: Partial<PlatformNotice>
): boolean {
  const current = getAnnouncements();
  const idx = current.findIndex((n) => n.id === id);
  if (idx === -1) return false;

  current[idx] = { ...current[idx], ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('kuroshelf_announcements_updated'));
    return true;
  } catch (err) {
    console.warn('[Announcements] Failed to update announcement:', err);
    return false;
  }
}

export function deleteAnnouncement(id: string): boolean {
  const current = getAnnouncements();
  const filtered = current.filter((n) => n.id !== id);
  if (filtered.length === current.length) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('kuroshelf_announcements_updated'));
    return true;
  } catch (err) {
    console.warn('[Announcements] Failed to delete announcement:', err);
    return false;
  }
}

export function getUnreadAnnouncementsCount(): number {
  try {
    const list = getAnnouncements();
    const lastRead = localStorage.getItem(LAST_READ_KEY);
    if (!lastRead) return list.length;
    const lastReadTime = new Date(lastRead).getTime();
    return list.filter((n) => new Date(n.createdAt).getTime() > lastReadTime).length;
  } catch {
    return 0;
  }
}

export function markAnnouncementsAsRead(): void {
  try {
    localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    window.dispatchEvent(new CustomEvent('kuroshelf_announcements_read'));
  } catch (err) {
    console.warn('[Announcements] Failed to mark announcements as read:', err);
  }
}
