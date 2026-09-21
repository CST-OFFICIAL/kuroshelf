import { AuthUser } from '../types';

export interface MembershipInfo {
  isPremium: boolean;
  tier?: 'vip' | 'patron';
  since?: string;
  expiresAt?: string;
}

export interface PollCreationRecord {
  pollId: string;
  userId: string;
  createdAt: number; // timestamp ms
}

export interface DonationEntry {
  id: string;
  supporterName: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
  createdAt: string;
  tierTitle?: string;
}

const STORAGE_KEYS = {
  MEMBERSHIP: 'kuroshelf_membership',
  POLL_CREATIONS: 'kuroshelf_poll_creations',
  DONATIONS: 'kuroshelf_donations',
  DONOR_STATUS: 'kuroshelf_is_donor',
  DONOR_PREFIX: 'kuroshelf_donor_',
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Default Wall of Honor donations
const INITIAL_DONATIONS: DonationEntry[] = [
  {
    id: 'don-1',
    supporterName: 'Kazuma & Megumin',
    amount: 1000,
    message: 'To keep KuroShelf independent and ad-free! Absolute favorite anime catalog.',
    createdAt: '2026-09-18T14:22:00Z',
    tierTitle: 'Dragon Deity Founder',
  },
  {
    id: 'don-2',
    supporterName: 'Ren (MangaSavant)',
    amount: 250,
    message: 'Thank you for the amazing Berserk and Vinland Saga tracking.',
    createdAt: '2026-09-15T09:10:00Z',
    tierTitle: 'Executive Producer',
  },
  {
    id: 'don-3',
    supporterName: 'ChainsawDev',
    amount: 50,
    message: 'Best prediction polls on the internet. Keep cooking!',
    createdAt: '2026-09-12T19:45:00Z',
    tierTitle: 'Collector Box Set Backer',
  },
  {
    id: 'don-4',
    supporterName: 'Anonymous Otaku',
    amount: 25,
    isAnonymous: true,
    message: 'Love from Tokyo!',
    createdAt: '2026-09-10T11:00:00Z',
    tierTitle: 'Manga Tankobon Sponsor',
  },
  {
    id: 'don-5',
    supporterName: 'Aoi_Kuro',
    amount: 15,
    message: 'For coffee and servers. Cheers to the community!',
    createdAt: '2026-09-08T16:30:00Z',
    tierTitle: 'Boba & Coffee Supporter',
  },
];

export function getMembership(userId?: string): MembershipInfo {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.MEMBERSHIP}_${userId || 'local'}`);
    if (raw) {
      return JSON.parse(raw);
    }
    // Also check global fallback
    const globalRaw = localStorage.getItem(STORAGE_KEYS.MEMBERSHIP);
    if (globalRaw) {
      return JSON.parse(globalRaw);
    }
  } catch (err) {
    console.warn('[Membership] Failed to read membership:', err);
  }
  return { isPremium: false };
}

export function setMembership(
  isPremium: boolean,
  tier: 'vip' | 'patron' = 'vip',
  userId?: string
): MembershipInfo {
  const info: MembershipInfo = {
    isPremium,
    tier: isPremium ? tier : undefined,
    since: isPremium ? new Date().toISOString() : undefined,
    expiresAt: isPremium
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  };

  try {
    const key = `${STORAGE_KEYS.MEMBERSHIP}_${userId || 'local'}`;
    localStorage.setItem(key, JSON.stringify(info));
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIP, JSON.stringify(info));

    // Also update current active user if present
    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const user: AuthUser = JSON.parse(activeRaw);
      user.is_premium = isPremium;
      user.premium_tier = isPremium ? tier : undefined;
      user.premium_since = info.since;
      localStorage.setItem('kuro_local_user', JSON.stringify(user));
    }
  } catch (err) {
    console.warn('[Membership] Failed to save membership:', err);
  }

  return info;
}

/**
 * Weekly poll creation quotas:
 * - Free: 1 poll per 7 days
 * - Premium (VIP): 7 polls per 7 days
 * - Participation (voting) is unlimited for everyone!
 */
export function getWeeklyPollStatus(
  userId?: string,
  isPremium?: boolean
): {
  used: number;
  limit: number;
  remaining: number;
  canCreate: boolean;
  resetsInDays: number;
} {
  const limit = isPremium ? 7 : 1;
  const now = Date.now();
  const cutoff = now - SEVEN_DAYS_MS;

  const creations = getPollCreations();
  const effectiveUserId = userId || 'anonymous_user';

  // Filter creations within the last 7 days by this user
  const recentCreations = creations.filter(
    (c) =>
      c.createdAt >= cutoff &&
      (c.userId === effectiveUserId || c.userId === 'anonymous_user' || !userId)
  );

  const used = recentCreations.length;
  const remaining = Math.max(0, limit - used);
  const canCreate = remaining > 0;

  let resetsInDays = 0;
  if (recentCreations.length > 0) {
    const oldestRecent = Math.min(...recentCreations.map((c) => c.createdAt));
    const expiresAt = oldestRecent + SEVEN_DAYS_MS;
    resetsInDays = Math.max(1, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)));
  }

  return {
    used,
    limit,
    remaining,
    canCreate,
    resetsInDays,
  };
}

export function getPollCreations(): PollCreationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POLL_CREATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPollCreation(pollId: string, userId?: string): void {
  try {
    const creations = getPollCreations();
    const effectiveUserId = userId || 'anonymous_user';
    creations.push({
      pollId,
      userId: effectiveUserId,
      createdAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.POLL_CREATIONS, JSON.stringify(creations));
  } catch (err) {
    console.warn('[Membership] Failed to record poll creation:', err);
  }
}

// Donations / Help KuroShelf Grow
export function getDonations(): DonationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DONATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(INITIAL_DONATIONS));
      return INITIAL_DONATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DONATIONS;
  }
}

export function getDonationTierTitle(amount: number): string {
  if (amount >= 1000) return 'Dragon Deity Founder';
  if (amount >= 500) return 'Executive Producer';
  if (amount >= 100) return 'Otaku Guild Patron';
  if (amount >= 50) return 'Collector Box Set Backer';
  if (amount >= 15) return 'Manga Tankobon Sponsor';
  return 'Boba & Coffee Supporter';
}

export function isUserDonor(userId?: string): boolean {
  try {
    if (userId) {
      const userKey = `${STORAGE_KEYS.DONOR_PREFIX}${userId}`;
      if (localStorage.getItem(userKey) === 'true') return true;
    }
    // Check global browser flag
    if (localStorage.getItem(STORAGE_KEYS.DONOR_STATUS) === 'true') return true;

    // Check active user in local storage
    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const user = JSON.parse(activeRaw);
      if (user.is_donor) return true;
    }
  } catch (err) {
    console.warn('[Membership] Failed to check donor status:', err);
  }
  return false;
}

export function setUserDonor(userId?: string, isDonor = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DONOR_STATUS, isDonor ? 'true' : 'false');
    if (userId) {
      localStorage.setItem(`${STORAGE_KEYS.DONOR_PREFIX}${userId}`, isDonor ? 'true' : 'false');
    }

    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const user = JSON.parse(activeRaw);
      user.is_donor = isDonor;
      localStorage.setItem('kuro_local_user', JSON.stringify(user));
    }

    window.dispatchEvent(new CustomEvent('kuroshelf_donor_status_changed', { detail: { isDonor } }));
  } catch (err) {
    console.warn('[Membership] Failed to set donor status:', err);
  }
}

export function submitDonation(donation: {
  supporterName: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
  userId?: string;
}): DonationEntry {
  const donations = getDonations();
  const newEntry: DonationEntry = {
    id: `don-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    supporterName: donation.isAnonymous ? 'Anonymous Otaku' : donation.supporterName.trim() || 'Generous Otaku',
    amount: Math.min(10000, Math.max(1, Number(donation.amount.toFixed(2)))),
    message: donation.message?.trim(),
    isAnonymous: donation.isAnonymous,
    createdAt: new Date().toISOString(),
    tierTitle: getDonationTierTitle(donation.amount),
  };

  const updated = [newEntry, ...donations];
  try {
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(updated));
    // Mark donor status for this user / device
    setUserDonor(donation.userId, true);
    // Dispatch real-time event for notice board ticker and UI
    window.dispatchEvent(new CustomEvent('kuroshelf_donation_made', { detail: newEntry }));
  } catch (err) {
    console.warn('[Membership] Failed to save donation:', err);
  }

  return newEntry;
}
