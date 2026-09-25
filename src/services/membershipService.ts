import { AuthUser } from '../types';

export interface MembershipInfo {
  isPremium: boolean;
  tier?: 'vip' | 'patron';
  billingCycle?: 'monthly' | 'yearly';
  pricePaid?: number;
  since?: string;
  expiresAt?: string;
  autoRenew?: boolean;
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
  userId?: string;
  expiresAt?: number; // ms timestamp for marquee ticker expiration (1 minute)
}

export interface UserDonationSummary {
  totalAmount: number;
  donationCount: number;
  history: DonationEntry[];
  latestDonationDate?: string;
  highestTierTitle?: string;
}

const STORAGE_KEYS = {
  MEMBERSHIP: 'kuroshelf_membership',
  POLL_CREATIONS: 'kuroshelf_poll_creations',
  DONATIONS: 'kuroshelf_donations',
  DONOR_STATUS: 'kuroshelf_is_donor',
  DONOR_PREFIX: 'kuroshelf_donor_',
  USER_DONATIONS_PREFIX: 'kuroshelf_user_donations_',
};

const ONE_MINUTE_MS = 60 * 1000;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THREE_SIXTY_FIVE_DAYS_MS = 365 * 24 * 60 * 60 * 1000;

export function getMembership(userId?: string): MembershipInfo {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.MEMBERSHIP}_${userId || 'local'}`);
    if (raw) {
      const parsed: MembershipInfo = JSON.parse(raw);
      // Check if expired
      if (parsed.isPremium && parsed.expiresAt) {
        const expiresTime = new Date(parsed.expiresAt).getTime();
        if (Date.now() > expiresTime) {
          parsed.isPremium = false;
        }
      }
      return parsed;
    }
    // Also check global fallback
    const globalRaw = localStorage.getItem(STORAGE_KEYS.MEMBERSHIP);
    if (globalRaw) {
      const parsed: MembershipInfo = JSON.parse(globalRaw);
      if (parsed.isPremium && parsed.expiresAt) {
        const expiresTime = new Date(parsed.expiresAt).getTime();
        if (Date.now() > expiresTime) {
          parsed.isPremium = false;
        }
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[Membership] Failed to read membership:', err);
  }
  return { isPremium: false };
}

export function subscribeMembership(options: {
  cycle: 'monthly' | 'yearly';
  tier?: 'vip' | 'patron';
  userId?: string;
  paymentMethod?: string;
}): MembershipInfo {
  const isYearly = options.cycle === 'yearly';
  const durationMs = isYearly ? THREE_SIXTY_FIVE_DAYS_MS : THIRTY_DAYS_MS;
  const pricePaid = isYearly ? 41.90 : 4.99;
  const tier = options.tier || 'vip';

  const info: MembershipInfo = {
    isPremium: true,
    tier,
    billingCycle: options.cycle,
    pricePaid,
    since: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationMs).toISOString(),
    autoRenew: true,
  };

  try {
    const key = `${STORAGE_KEYS.MEMBERSHIP}_${options.userId || 'local'}`;
    localStorage.setItem(key, JSON.stringify(info));
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIP, JSON.stringify(info));

    // Also update current active user if present
    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const user: AuthUser = JSON.parse(activeRaw);
      user.is_premium = true;
      user.premium_tier = tier;
      user.premium_since = info.since;
      localStorage.setItem('kuro_local_user', JSON.stringify(user));
    }

    window.dispatchEvent(new CustomEvent('kuroshelf_membership_updated', { detail: info }));
  } catch (err) {
    console.warn('[Membership] Failed to save subscription:', err);
  }

  return info;
}

export function cancelMembership(userId?: string): MembershipInfo {
  const current = getMembership(userId);
  const info: MembershipInfo = {
    ...current,
    isPremium: false,
    autoRenew: false,
  };

  try {
    const key = `${STORAGE_KEYS.MEMBERSHIP}_${userId || 'local'}`;
    localStorage.setItem(key, JSON.stringify(info));
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIP, JSON.stringify(info));

    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const user: AuthUser = JSON.parse(activeRaw);
      user.is_premium = false;
      user.premium_tier = undefined;
      localStorage.setItem('kuro_local_user', JSON.stringify(user));
    }

    window.dispatchEvent(new CustomEvent('kuroshelf_membership_updated', { detail: info }));
  } catch (err) {
    console.warn('[Membership] Failed to cancel membership:', err);
  }

  return info;
}

export function setMembership(
  isPremium: boolean,
  tier: 'vip' | 'patron' = 'vip',
  userId?: string
): MembershipInfo {
  if (isPremium) {
    return subscribeMembership({ cycle: 'monthly', tier, userId });
  } else {
    return cancelMembership(userId);
  }
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
const STATIC_BOT_IDS = new Set(['don-1', 'don-2', 'don-3', 'don-4', 'don-5', 'don-6', 'fake-1', 'fake-2', 'bot-1', 'bot-2']);

/**
 * Returns all historical donations for records and leaderboards.
 */
export function getDonations(): DonationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DONATIONS);
    if (!raw) {
      return [];
    }
    const parsed: DonationEntry[] = JSON.parse(raw);
    const seenIds = new Set<string>();
    // Filter out only static hardcoded mock/bot donors and duplicates
    const genuine = parsed
      .filter((d) => !STATIC_BOT_IDS.has(d.id) && !d.id.startsWith('mock-') && !d.id.match(/^don-[1-9]$/))
      .map((d) => {
        // Upgrade legacy don-timestamp IDs to kuro-don format so they persist cleanly
        if (d.id.startsWith('don-')) {
          return { ...d, id: d.id.replace('don-', 'kuro-don-') };
        }
        return d;
      })
      .filter((d) => {
        if (!d.id || seenIds.has(d.id)) return false;
        seenIds.add(d.id);
        return true;
      });

    if (genuine.length !== parsed.length || parsed.some(d => d.id.startsWith('don-'))) {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(genuine));
    }
    return genuine;
  } catch {
    return [];
  }
}

/**
 * Returns active donations for the marquee notice board.
 * Each donation has a 1-minute (60 seconds) expiration window on the ticker so names do not loop forever!
 */
export function getActiveTickerDonations(): DonationEntry[] {
  const all = getDonations();
  const now = Date.now();

  return all.filter((d) => {
    // If expiresAt is set, respect it strictly (1 minute expiry)
    if (d.expiresAt) {
      return now < d.expiresAt;
    }
    // Backward compatibility: use createdAt + 1 minute
    const createdTime = new Date(d.createdAt).getTime();
    if (!isNaN(createdTime)) {
      return now - createdTime < ONE_MINUTE_MS;
    }
    return false;
  });
}

/**
 * Retrieves the personal account donation record for a user.
 */
export function getUserDonationRecord(userId?: string): UserDonationSummary {
  if (!userId) {
    // Check fallback for local user
    try {
      const activeRaw = localStorage.getItem('kuro_local_user');
      if (activeRaw) {
        const u = JSON.parse(activeRaw);
        if (u?.id) return getUserDonationRecord(u.id);
      }
    } catch {}
    return { totalAmount: 0, donationCount: 0, history: [] };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.USER_DONATIONS_PREFIX}${userId}`);
    if (raw) {
      const parsed: UserDonationSummary = JSON.parse(raw);
      if (Array.isArray(parsed.history)) {
        const seen = new Set<string>();
        parsed.history = parsed.history.filter((item) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      }
      return parsed;
    }

    // Fallback: search global donations list for this user's contributions
    const all = getDonations();
    const userDonations = all.filter(d => d.userId === userId);
    if (userDonations.length > 0) {
      const seen = new Set<string>();
      const uniqueDonations = userDonations.filter(d => {
        if (!d.id || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
      const total = uniqueDonations.reduce((sum, d) => sum + d.amount, 0);
      const highestTier = getDonationTierTitle(Math.max(...uniqueDonations.map(d => d.amount)));
      const summary: UserDonationSummary = {
        totalAmount: Number(total.toFixed(2)),
        donationCount: uniqueDonations.length,
        history: uniqueDonations,
        latestDonationDate: uniqueDonations[0]?.createdAt,
        highestTierTitle: highestTier,
      };
      localStorage.setItem(`${STORAGE_KEYS.USER_DONATIONS_PREFIX}${userId}`, JSON.stringify(summary));
      return summary;
    }
  } catch (err) {
    console.warn('[Membership] Failed to fetch user donations record:', err);
  }

  return { totalAmount: 0, donationCount: 0, history: [] };
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
      const userSummary = getUserDonationRecord(userId);
      if (userSummary.totalAmount > 0) return true;
    }
    // Check global browser flag
    if (localStorage.getItem(STORAGE_KEYS.DONOR_STATUS) === 'true') return true;

    // Check active user in local storage
    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const user = JSON.parse(activeRaw);
      if (user.is_donor) return true;
      if (user.id) {
        const summary = getUserDonationRecord(user.id);
        if (summary.totalAmount > 0) return true;
      }
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
  const nowMs = Date.now();
  const validAmount = Math.min(10000, Math.max(1, Number(donation.amount.toFixed(2))));

  const newEntry: DonationEntry = {
    id: `kuro-don-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
    supporterName: donation.isAnonymous ? 'Anonymous Otaku' : donation.supporterName.trim() || 'Generous Otaku',
    amount: validAmount,
    message: donation.message?.trim(),
    isAnonymous: donation.isAnonymous,
    createdAt: new Date(nowMs).toISOString(),
    tierTitle: getDonationTierTitle(validAmount),
    userId: donation.userId,
    // 1-minute expiration on ticker so names don't loop forever
    expiresAt: nowMs + ONE_MINUTE_MS,
  };

  const updated = [newEntry, ...donations.filter(d => d.id !== newEntry.id)];
  try {
    // 1. Save to global list of donations
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(updated));

    // 2. Record contribution to the user's personal account
    if (donation.userId) {
      const existingRecord = getUserDonationRecord(donation.userId);
      const updatedTotal = Number((existingRecord.totalAmount + validAmount).toFixed(2));
      const updatedHistory = [newEntry, ...existingRecord.history.filter(d => d.id !== newEntry.id)];
      const highestTier = getDonationTierTitle(Math.max(...updatedHistory.map(d => d.amount)));

      const updatedRecord: UserDonationSummary = {
        totalAmount: updatedTotal,
        donationCount: existingRecord.donationCount + 1,
        history: updatedHistory,
        latestDonationDate: newEntry.createdAt,
        highestTierTitle: highestTier,
      };

      localStorage.setItem(
        `${STORAGE_KEYS.USER_DONATIONS_PREFIX}${donation.userId}`,
        JSON.stringify(updatedRecord)
      );
    }

    // 3. Mark donor status for this user / device
    setUserDonor(donation.userId, true);

    // 4. Dispatch real-time events for ticker, profile, and navigation
    window.dispatchEvent(new CustomEvent('kuroshelf_donation_made', { detail: newEntry }));
    window.dispatchEvent(new CustomEvent('kuroshelf_account_donation_updated', {
      detail: { userId: donation.userId, amount: validAmount }
    }));
  } catch (err) {
    console.warn('[Membership] Failed to save donation:', err);
  }

  return newEntry;
}
