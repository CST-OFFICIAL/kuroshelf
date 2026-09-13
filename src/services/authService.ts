
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';

export function getStoredAuthToken(): string | null {
  // Supabase handles session storage. We just need to attach the token if we want to call our own API.
  const sessionStr = localStorage.getItem('sb-' + (import.meta.env.VITE_SUPABASE_URL ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0] : 'placeholder') + '-auth-token');
  if (sessionStr) {
    try {
      const parsed = JSON.parse(sessionStr);
      return parsed.access_token || null;
    } catch {}
  }
  return null;
}

export function setStoredAuthToken(_token: string | null) {
  // NO-OP, Supabase handles it
}

export function getAuthHeaders(): HeadersInit {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return {
    id: user.id ,
    email: user.email!,
    username: user.user_metadata?.user_name || user.email?.split('@')[0] || 'User',
    avatar_url: user.user_metadata?.avatar_url || null,
    created_at: user.created_at || new Date().toISOString(),
  };
}

export async function registerUser(email: string, username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_name: username,
      }
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user ? {
    id: data.user.id ,
    email: data.user.email!,
    username: username,
    created_at: data.user.created_at || new Date().toISOString(),
  } : undefined };
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
    options: {
      redirectTo: window.location.origin,
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
