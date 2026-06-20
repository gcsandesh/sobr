/**
 * Client-safe env. Only EXPO_PUBLIC_* vars are bundled into the app. The
 * privileged DATABASE_URL is server-only and never referenced here.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

/** True once the user has wired their Supabase project. Drives a setup screen. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
