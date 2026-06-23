import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env, isSupabaseConfigured } from './env';

/**
 * Supabase client for the app. Uses the anon key + RLS, so it can only ever read
 * or write the signed-in user's own rows. Session is persisted in AsyncStorage
 * (web uses localStorage under the hood). No service-role key ever lives here.
 *
 * When env vars aren't set yet, we fall back to harmless placeholders so the
 * module can load without throwing — the routing gate sends the user to the
 * setup screen before any real request is ever made.
 */
const url = isSupabaseConfigured ? env.supabaseUrl : 'https://placeholder.supabase.co';
const anonKey = isSupabaseConfigured ? env.supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // PKCE is the secure OAuth flow for native; exchangeCodeForSession depends on it.
    flowType: 'pkce',
    // URL-based session detection handles the web OAuth/magic-link redirect.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
