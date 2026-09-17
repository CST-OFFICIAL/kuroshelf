
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser } from '../types';

export async function getStoredAuthToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch (e) {
    return null;
  }
}

export function setStoredAuthToken(_token: string | null) {
  // NO-OP
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
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id ,
      email: user.email!,
      username: user.user_metadata?.user_name || user.email?.split('@')[0] || 'User',
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      profile_setup_complete: !!user.user_metadata?.user_name,
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at || new Date().toISOString(),
    };
  } catch (e) {
    return null;
  }
}

export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
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
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, user: data.user ? {
    id: data.user.id,
    email: data.user.email!,
    username: data.user.user_metadata?.user_name || data.user.email?.split('@')[0] || 'User',
    display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
    profile_setup_complete: !!data.user.user_metadata?.user_name,
    avatar_url: data.user.user_metadata?.avatar_url || null,
    created_at: data.user.created_at || new Date().toISOString(),
  } : undefined };
}

export async function updateProfileSetup(username: string, displayName: string, password?: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check uniqueness
  const { data: existingUsernames } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id);
  
  if (existingUsernames && existingUsernames.length > 0) {
    return { success: false, error: 'Username is already taken' };
  }

  const { data: existingDisplayNames } = await supabase
    .from('profiles')
    .select('id')
    .eq('display_name', displayName)
    .neq('id', user.id);
  
  if (existingDisplayNames && existingDisplayNames.length > 0) {
    return { success: false, error: 'Display name is already taken' };
  }

  // Update Auth Metadata
  const attributes: any = { data: { user_name: username, full_name: displayName } };
  if (password) {
    attributes.password = password;
  }
  
  const { error: authError } = await supabase.auth.updateUser(attributes);
  if (authError) {
    return { success: false, error: authError.message };
  }

  // Update Profiles Table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      username: username,
      display_name: displayName
    })
    .eq('id', user.id);
    
  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true };
}

export async function loginUser(identifier: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  // Note: Supabase supports login with email, not username by default.
  // We'll treat identifier as email here.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user ? {
    id: data.user.id ,
    email: data.user.email!,
    username: data.user.user_metadata?.user_name || data.user.email?.split('@')[0] || 'User',
    display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
    profile_setup_complete: !!data.user.user_metadata?.user_name,
    avatar_url: data.user.user_metadata?.avatar_url || null,
    created_at: data.user.created_at || new Date().toISOString(),
  } : undefined };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
