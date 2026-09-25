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
 * Step 1 of a reset: Supabase emails a 6-digit code (our send-email hook
 * renders it). Code-based rather than link-based on purpose: a link has to
 * deep-link back into the app, and the Site URL still points at localhost.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
}

/**
 * Step 2: redeem the code (which signs the user in) and immediately set the
 * new password on that fresh session.
 */
export async function resetPasswordWithCode(params: {
  email: string;
  code: string;
  password: string;
}): Promise<void> {
  const { error: otpError } = await supabase.auth.verifyOtp({
    email: params.email.trim(),
    token: params.code.trim(),
    type: 'recovery',
  });
  if (otpError) throw otpError;
  await changePassword(params.password);
}

/** "jane.doe@x.com" → "Jane Doe"; the fallback when no name has been set. */
export function nameFromEmail(email: string | null): string | null {
  if (!email) return null;
  const words = (email.split('@')[0] ?? '').split(/[._\-+0-9]+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
}
