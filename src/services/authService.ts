
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser } from '../types';
import { isAdminUser, validateUsername } from './profileCustomizationService';

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
      profile_setup_complete: true,
      role: isAdmin ? 'admin' : (parsed.role || 'user')
    };
  } else {
    updatedUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      email: `${cleanUsername}@kuroshelf.local`,
      username: cleanUsername,
      display_name: displayName.trim(),
      profile_setup_complete: true,
      role: isAdmin ? 'admin' : 'user',
      created_at: new Date().toISOString()
    };
  }
  localStorage.setItem('kuro_local_user', JSON.stringify(updatedUser));

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
      return { success: true, user: authUser };
    }
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
        return { success: true, user: parsed };
      }
    } catch (e) {}
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
