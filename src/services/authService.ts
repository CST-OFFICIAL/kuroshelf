import { AuthUser } from '../types';

const TOKEN_STORAGE_KEY = 'kuroshelf_auth_token';

let cachedToken: string | null = null;

export function getStoredAuthToken(): string | null {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null) {
  cachedToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage access unavailable
  }
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
  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.user || null;
  } catch {
    return null;
  }
}

export async function registerUser(email: string, username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to register account' };
    }
    if (json.token) {
      setStoredAuthToken(json.token);
    }
    return { success: true, user: json.user };
  } catch (err) {
    return { success: false, error: 'Network error connecting to registration server' };
  }
}

export async function loginUser(identifier: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Invalid credentials' };
    }
    if (json.token) {
      setStoredAuthToken(json.token);
    }
    return { success: true, user: json.user };
  } catch (err) {
    return { success: false, error: 'Network error connecting to login server' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch {
    // Ignore network error on logout
  } finally {
    setStoredAuthToken(null);
  }
}
