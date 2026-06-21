import Constants from 'expo-constants';

/**
 * Client-safe env. Only public keys are exposed. We read them from the app
 * config's `extra` (populated by app.config.js from the repo-root .env) and fall
 * back to EXPO_PUBLIC_* in case they were provided directly. The privileged
 * DATABASE_URL is server-only and never referenced here.
 */
type Extra = { supabaseUrl?: string | null; supabaseAnonKey?: string | null };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  supabaseUrl: extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

/** True once the user has wired their Supabase project. Drives a setup screen. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
