import fs from 'fs';
let content = fs.readFileSync('src/services/authService.ts', 'utf-8');

const target = `export function getStoredAuthToken(): string | null {
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
    headers['Authorization'] = \`Bearer \${token}\`;
  }
  return headers;
}`;

const replacement = `export async function getStoredAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
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
    headers['Authorization'] = \`Bearer \${token}\`;
  }
  return headers;
}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/services/authService.ts', content);
