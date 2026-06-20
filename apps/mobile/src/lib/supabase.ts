import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env } from './env';

/**
 * Supabase client for the app. Uses the anon key + RLS, so it can only ever read
 * or write the signed-in user's own rows. Session is persisted in AsyncStorage
 * (web uses localStorage under the hood). No service-role key ever lives here.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // URL-based session detection only matters on web magic-link redirects.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
