import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  'https://qpalwnbnmxotdyrxixmz.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseAnonKey.trim() !== ''
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [Supabase] VITE_SUPABASE_ANON_KEY is not defined in client/.env. Please paste your anon key from Supabase Dashboard > Project Settings > API.'
  );
}

// Fallback dummy key to prevent createClient initialization throw if key is not yet set in .env
const anonKeyToUse = supabaseAnonKey || 'placeholder-anon-key-configure-in-client-env';

export const supabase = createClient(supabaseUrl, anonKeyToUse, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
