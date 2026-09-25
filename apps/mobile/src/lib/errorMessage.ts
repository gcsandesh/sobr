/**
 * Pull a human-readable message out of anything thrown.
 *
 * supabase-js rejects with plain objects (PostgrestError, StorageError,
 * AuthError), not `Error` instances — so the obvious `e instanceof Error` check
 * silently falls through to a generic "check your connection", which is exactly
 * how a missing GRANT looked like a network problem for as long as it did.
 */
export function errorMessage(e: unknown, fallback = 'Something went wrong.'): string {
  if (typeof e === 'string' && e.trim()) return e;
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    // `hint` is often the only part of a Postgres error that suggests a fix.
    const parts = [o.message, o.hint].filter((v): v is string => typeof v === 'string' && !!v);
    if (parts.length) return parts.join(' — ');
  }
  return fallback;
}

/**
 * Auth errors, reworded. GoTrue's own strings ("Invalid login credentials",
 * "Token has expired or is invalid") are accurate but cold; anything we don't
 * recognise passes through unchanged rather than being hidden.
 */
export function authErrorMessage(e: unknown): string {
  const raw = errorMessage(e, 'Couldn’t reach sobr. Check your connection and try again.');
  const m = raw.toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'That email and password don’t match. Try again, or reset your password.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'There’s already an account with that email. Sign in instead?';
  if (m.includes('expired') || m.includes('invalid') && m.includes('token'))
    return 'That code has expired or isn’t right. Request a new one and try again.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many tries in a row. Give it a minute, then try again.';
  if (m.includes('should be different'))
    return 'Your new password needs to be different from the old one.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Couldn’t reach sobr. Check your connection and try again.';
  return raw;
}
