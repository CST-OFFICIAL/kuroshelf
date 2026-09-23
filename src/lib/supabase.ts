import { createClient } from '@supabase/supabase-js';

// Automatically detect credentials from any framework prefix provided by Vercel / Supabase integration:
// 1. VITE_SUPABASE_URL
// 2. NEXT_PUBLIC_SUPABASE_URL
// 3. SUPABASE_URL
const rawUrl = 
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL ||
  (import.meta.env as any).SUPABASE_URL ||
  '';

let supabaseUrl = rawUrl.trim();
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseUrl = u.origin;
  }
} catch {
  // fallback if raw string isn't standard URL
}

// 1. VITE_SUPABASE_ANON_KEY
// 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
// 3. SUPABASE_ANON_KEY
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (import.meta.env as any).SUPABASE_ANON_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Warning: Supabase URL or Anon Key is missing. Check your Vercel / Supabase integration variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);
