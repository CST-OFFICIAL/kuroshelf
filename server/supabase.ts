import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrlRaw = 
  process.env.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  '';
let supabaseUrl = supabaseUrlRaw.trim();
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseUrl = u.origin;
  }
} catch (e) {
  // fallback if invalid
}

const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase] Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Database features will not work until configured.');
}

// Service role client for server-side admin operations (bypasses RLS)
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);
