
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser, SavedAccount } from '../types';
import { isAdminUser, validateUsername, saveStoredProfileCustomization, getStoredProfileCustomization } from './profileCustomizationService';

const SAVED_ACCOUNTS_KEY = 'kuro_saved_accounts';

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    let accounts: SavedAccount[] = raw ? JSON.parse(raw) : [];
    
    // Auto-remove any legacy fake/demo accounts
    const fakeAccountIds = new Set(['acc_ren_mangasavant', 'acc_sakura_animereviewer']);
    const beforeCount = accounts.length;
    accounts = accounts.filter((a) => !fakeAccountIds.has(a.user.id));
    if (accounts.length !== beforeCount) {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    // Auto-migrate current active user if not already in saved accounts
    const activeRaw = localStorage.getItem('kuro_local_user');
    if (activeRaw) {
      const activeUser: AuthUser = JSON.parse(activeRaw);
      if (fakeAccountIds.has(activeUser.id)) {
        localStorage.removeItem('kuro_local_user');
        localStorage.removeItem('kuro_local_token');
      } else if (!accounts.some((a) => a.user.id === activeUser.id)) {
        accounts.push({
          user: activeUser,
          token: localStorage.getItem('kuro_local_token'),
          lastActiveAt: Date.now(),
        });
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
      }
    }
    return accounts;
  } catch (e) {
    console.warn('[Auth] Failed to load saved accounts:', e);
    return [];
  }
}

export function saveAccount(user: AuthUser, token?: string | null): SavedAccount[] {
  try {
    const current = getSavedAccounts();
    const existingIndex = current.findIndex((a) => a.user.id === user.id);
    const updatedAccount: SavedAccount = {
      user,
      token: token !== undefined ? token : (existingIndex >= 0 ? current[existingIndex].token : null),
      lastActiveAt: Date.now(),
    };

    let updatedList: SavedAccount[];
    if (existingIndex >= 0) {
      updatedList = [...current];
      updatedList[existingIndex] = updatedAccount;
    } else {
      updatedList = [updatedAccount, ...current];
    }

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.warn('[Auth] Failed to save account to saved list:', e);
    return [];
  }
}

export async function switchAccount(userId: string): Promise<AuthUser | null> {
  const accounts = getSavedAccounts();
  const target = accounts.find((a) => a.user.id === userId);
  if (!target) return null;

  // Set active user & token
  localStorage.setItem('kuro_local_user', JSON.stringify(target.user));
  if (target.token) {
    localStorage.setItem('kuro_local_token', target.token);
  } else {
    localStorage.removeItem('kuro_local_token');
  }

  // Update last active
  saveAccount(target.user, target.token);
  return target.user;
}

export async function removeSavedAccount(userId: string): Promise<{ remainingAccounts: SavedAccount[]; nextActiveUser: AuthUser | null }> {
  const current = getSavedAccounts();
  const filtered = current.filter((a) => a.user.id !== userId);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));

  const activeRaw = localStorage.getItem('kuro_local_user');
  let nextActive: AuthUser | null = null;
  if (activeRaw) {
    try {
      const activeUser: AuthUser = JSON.parse(activeRaw);
      if (activeUser.id === userId) {
        // Active user was removed, switch to next or null
        if (filtered.length > 0) {
          nextActive = filtered[0].user;
          localStorage.setItem('kuro_local_user', JSON.stringify(nextActive));
          if (filtered[0].token) {
            localStorage.setItem('kuro_local_token', filtered[0].token);
          } else {
            localStorage.removeItem('kuro_local_token');
          }
        } else {
          localStorage.removeItem('kuro_local_user');
          localStorage.removeItem('kuro_local_token');
        }
      } else {
        nextActive = activeUser;
      }
    } catch {}
  }

  return { remainingAccounts: filtered, nextActiveUser: nextActive };
}

export interface PresetDemoAccount {
  user: AuthUser;
  description: string;
  avatarPreset: string;
  bannerPreset: string;
  tagline: string;
}

export const PRESET_ACCOUNTS: PresetDemoAccount[] = [
  {
    user: {
      id: 'kuro_admin_master',
      email: 'kuro@kuroshelf.com',
      username: 'Kuro',
      display_name: 'Kuro',
      profile_setup_complete: true,
      role: 'admin',
      created_at: '2026-01-01T00:00:00Z',
    },
    description: 'Platform creator & Sovereign Admin with limitless dragon perks and admin authority.',
    avatarPreset: 'kuro_dragon_emperor',
    bannerPreset: 'kuro_imperial_dragon',
    tagline: 'Sovereign Administrator',
  },
];

export async function quickLogInPresetAccount(accountId: string): Promise<AuthUser> {
  const preset = PRESET_ACCOUNTS.find((p) => p.user.id === accountId) || PRESET_ACCOUNTS[0];
  const user = preset.user;

  // Initialize their custom profile presets if not exists
  const existingCustom = getStoredProfileCustomization(user.id);
  if (!existingCustom.bio) {
    saveStoredProfileCustomization(
      {
        ...existingCustom,
        avatar_preset: preset.avatarPreset,
        banner_preset: preset.bannerPreset,
        bio: preset.description,
        status_message: preset.tagline,
      },
      user.id
    );
  }

  // Set active user
  localStorage.setItem('kuro_local_user', JSON.stringify(user));
  localStorage.removeItem('kuro_local_token');

  // Save to multi-accounts
  saveAccount(user);

  return user;
}

export async function getStoredAuthToken(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    const local = localStorage.getItem('kuro_local_token');
    return local || null;
  }
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch (e) {
    return null;
  }
}

export function setStoredAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('kuro_local_token', token);
  } else {
    localStorage.removeItem('kuro_local_token');
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // Check local stored session first as fallback or offline mode
  const getLocalUser = (): AuthUser | null => {
    try {
      const local = localStorage.getItem('kuro_local_user');
      if (local) {
        const u = JSON.parse(local) as AuthUser;
        const isAdmin = isAdminUser(u);
        return { ...u, role: isAdmin ? 'admin' : (u.role || 'user') };
      }
    } catch (e) {}
    return null;
  };

  if (!isSupabaseConfigured) {
    return getLocalUser();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return getLocalUser();
    }
    const username = user.user_metadata?.user_name || user.email?.split('@')[0] || 'User';
    const isAdmin = username.toLowerCase() === 'kuro' || user.user_metadata?.role === 'admin';
    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      username: username,
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      profile_setup_complete: !!user.user_metadata?.user_name,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: isAdmin ? 'admin' : 'user',
      created_at: user.created_at || new Date().toISOString(),
    };
    // Sync local mirror
    localStorage.setItem('kuro_local_user', JSON.stringify(authUser));
    return authUser;
  } catch (e) {
    return getLocalUser();
  }
}

export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    // Offline simulation for dev
    return { success: true };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function verifyEmailOtp(email: string, token: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (!isSupabaseConfigured) {
    const uname = email.split('@')[0];
    const isAdmin = uname.toLowerCase() === 'kuro';
    const fakeUser: AuthUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      username: uname,
      display_name: uname,
      profile_setup_complete: false,
      role: isAdmin ? 'admin' : 'user',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('kuro_local_user', JSON.stringify(fakeUser));
    return { success: true, user: fakeUser };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) {
    return { success: false, error: error.message };
  }
  const rawUser = data.user;
  if (!rawUser) return { success: false, error: 'User verification failed.' };

  const username = rawUser.user_metadata?.user_name || rawUser.email?.split('@')[0] || 'User';
  const isAdmin = username.toLowerCase() === 'kuro';
  const finalUser: AuthUser = {
    id: rawUser.id,
    email: rawUser.email!,
    username: username,
    display_name: rawUser.user_metadata?.full_name || rawUser.email?.split('@')[0] || 'User',
    profile_setup_complete: !!rawUser.user_metadata?.user_name,
    avatar_url: rawUser.user_metadata?.avatar_url || null,
    role: isAdmin ? 'admin' : 'user',
    created_at: rawUser.created_at || new Date().toISOString(),
  };
  localStorage.setItem('kuro_local_user', JSON.stringify(finalUser));
  return { success: true, user: finalUser };
}

export async function registerUser(
  username: string,
  displayName: string,
  email: string,
  password?: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const validation = validateUsername(username, null);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (!displayName.trim() || displayName.trim().length < 2) {
    return { success: false, error: 'Display name must be at least 2 characters.' };
  }

  const cleanUsername = username.trim().toLowerCase();
  const isAdmin = cleanUsername === 'kuro';

  if (isSupabaseConfigured && password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            user_name: cleanUsername,
            full_name: displayName.trim(),
            role: isAdmin ? 'admin' : 'user'
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          username: cleanUsername,
          display_name: displayName.trim(),
          profile_setup_complete: true,
          role: isAdmin ? 'admin' : 'user',
          created_at: data.user.created_at || new Date().toISOString(),
        };
        localStorage.setItem('kuro_local_user', JSON.stringify(authUser));
        saveAccount(authUser);
        return { success: true, user: authUser };
      }
    } catch (e: any) {
      console.warn('[Auth] Supabase signup error, falling back:', e.message);
    }
  }

  // Local/Offline creation for direct accessibility
  const localUser: AuthUser = {
    id: 'user_' + Math.random().toString(36).substring(2, 10),
    email: email.trim() || `${cleanUsername}@kuroshelf.local`,
    username: cleanUsername,
    display_name: displayName.trim(),
    profile_setup_complete: true,
    role: isAdmin ? 'admin' : 'user',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem('kuro_local_user', JSON.stringify(localUser));
  saveAccount(localUser);
  return { success: true, user: localUser };
}

export async function updateProfileSetup(
  username: string,
  displayName: string,
  password?: string,
  avatarUrl?: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const validation = validateUsername(username);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (!displayName.trim() || displayName.trim().length < 2) {
    return { success: false, error: 'Display name must be at least 2 characters.' };
  }

  const cleanUsername = username.trim().toLowerCase();
  const isAdmin = cleanUsername === 'kuro';

  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check uniqueness
        const { data: existingUsernames } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', user.id);
        
        if (existingUsernames && existingUsernames.length > 0) {
          return { success: false, error: 'Username is already taken' };
        }

        const attributes: any = { 
          data: { 
            user_name: cleanUsername, 
            full_name: displayName.trim(),
            role: isAdmin ? 'admin' : 'user',
            ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {})
          } 
        };
        if (password) {
          attributes.password = password;
        }
        
        await supabase.auth.updateUser(attributes);
        await supabase
          .from('profiles')
          .update({ 
            username: cleanUsername,
            display_name: displayName.trim(),
            ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {})
          })
          .eq('id', user.id);
      }
    } catch (e: any) {
      console.warn('[Profiles] Supabase profile update error:', e.message);
    }
  }

  // Update local session
  const currentLocal = localStorage.getItem('kuro_local_user');
  let updatedUser: AuthUser;
  if (currentLocal) {
    const parsed = JSON.parse(currentLocal);
    updatedUser = {
      ...parsed,
      username: cleanUsername,
      display_name: displayName.trim(),
      avatar_url: avatarUrl !== undefined ? avatarUrl : (parsed.avatar_url || null),
      profile_setup_complete: true,
      role: isAdmin ? 'admin' : (parsed.role || 'user')
    };
  } else {
    updatedUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      email: `${cleanUsername}@kuroshelf.local`,
      username: cleanUsername,
      display_name: displayName.trim(),
      avatar_url: avatarUrl || null,
      profile_setup_complete: true,
      role: isAdmin ? 'admin' : 'user',
      created_at: new Date().toISOString()
    };
  }
  localStorage.setItem('kuro_local_user', JSON.stringify(updatedUser));
  saveAccount(updatedUser);

  return { success: true, user: updatedUser };
}

export async function loginUser(identifier: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const clean = identifier.trim().toLowerCase();
  
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    });

    if (!error && data.user) {
      const username = data.user.user_metadata?.user_name || data.user.email?.split('@')[0] || 'User';
      const isAdmin = username.toLowerCase() === 'kuro' || data.user.user_metadata?.role === 'admin';
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        username: username,
        display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        profile_setup_complete: !!data.user.user_metadata?.user_name,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        role: isAdmin ? 'admin' : 'user',
        created_at: data.user.created_at || new Date().toISOString(),
      };
      localStorage.setItem('kuro_local_user', JSON.stringify(authUser));
      saveAccount(authUser, data.session?.access_token);
      return { success: true, user: authUser };
    }
  }

  // Check already saved accounts list
  const savedList = getSavedAccounts();
  const matchedSaved = savedList.find(
    (a) =>
      a.user.email.toLowerCase() === clean ||
      a.user.username.toLowerCase() === clean
  );
  if (matchedSaved) {
    localStorage.setItem('kuro_local_user', JSON.stringify(matchedSaved.user));
    if (matchedSaved.token) {
      localStorage.setItem('kuro_local_token', matchedSaved.token);
    }
    saveAccount(matchedSaved.user, matchedSaved.token);
    return { success: true, user: matchedSaved.user };
  }

  // Local/Offline account check
  const local = localStorage.getItem('kuro_local_user');
  if (local) {
    try {
      const parsed = JSON.parse(local) as AuthUser;
      if (
        parsed.email.toLowerCase() === clean ||
        parsed.username.toLowerCase() === clean
      ) {
        saveAccount(parsed);
        return { success: true, user: parsed };
      }
    } catch (e) {}
  }

  // Check preset accounts (e.g. MangaSavant, SakuraDreamer)
  const matchedPreset = PRESET_ACCOUNTS.find(
    (p) =>
      p.user.username.toLowerCase() === clean ||
      p.user.email.toLowerCase() === clean
  );
  if (matchedPreset) {
    const user = await quickLogInPresetAccount(matchedPreset.user.id);
    return { success: true, user };
  }

  // If user enters Kuro as identifier in demo/offline mode
  if (clean === 'kuro' || clean === 'kuro@kuroshelf.com') {
    const kuroAdmin: AuthUser = {
      id: 'kuro_admin_master',
      email: 'kuro@kuroshelf.com',
      username: 'Kuro',
      display_name: 'Kuro',
      profile_setup_complete: true,
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('kuro_local_user', JSON.stringify(kuroAdmin));
    saveAccount(kuroAdmin);
    return { success: true, user: kuroAdmin };
  }

  return { success: false, error: 'Invalid credentials. Please verify your email/username and password.' };
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem('kuro_local_user');
  localStorage.removeItem('kuro_local_token');
}

export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Google sign-in requires Supabase configuration.' };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
