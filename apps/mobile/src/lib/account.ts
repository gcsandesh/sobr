import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/**
 * Account operations that go through Supabase Auth rather than our tables.
 *
 * The display name lives in the auth user's `user_metadata`, not in
 * `user_settings`: it's identity, not a preference, and keeping it there means
 * no migration and no extra RLS surface. `onAuthStateChange` fires
 * USER_UPDATED after `updateUser`, so the session (and every screen reading
 * it) picks the new name up on its own.
 */

export const MIN_PASSWORD = 6;

export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { display_name: name.trim() || null },
  });
  if (error) throw error;
}

export async function changePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Where the reset email's link sends the user: straight into the app's
 * reset screen. Supabase only honours it if it's in Authentication → URL
 * Configuration → Redirect URLs; otherwise it falls back to the Site URL.
 */
export function resetRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/reset-password`;
  }
  return Linking.createURL('reset-password'); // sobr://reset-password in a release build
}

/**
 * Step 1 of a reset. The email can carry a link (default template) and/or a
 * code (custom template); the app handles both. The link works without
 * custom SMTP, which Supabase requires before templates can be edited.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: resetRedirectUrl(),
  });
  if (error) throw error;
}

/** Step 2 (code path): redeeming the code signs the user in. */
export async function verifyRecoveryCode(email: string, code: string): Promise<void> {
  // A retry after the code was redeemed but the password save failed: the
  // code is spent, but its session is live.
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.email?.toLowerCase() === email.trim().toLowerCase()) return;
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: 'recovery',
  });
  if (error) throw error;
}

/** "jane.doe@x.com" → "Jane Doe"; the fallback when no name has been set. */
export function nameFromEmail(email: string | null): string | null {
  if (!email) return null;
  const words = (email.split('@')[0] ?? '').split(/[._\-+0-9]+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
}
