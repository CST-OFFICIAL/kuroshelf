import { createClient } from '@supabase/supabase-js';

const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseUrl = supabaseUrlRaw.trim();
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseUrl = u.origin;
  }
} catch (e) {
  // fallback if invalid
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Auth will not work until configured.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
