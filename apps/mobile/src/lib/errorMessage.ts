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
