import {
  computeFreezeAward,
  type DailyEntryWithDrinks,
  type Drink,
  type DrinkInput,
  type EntryStatus,
  type FreezeGrant,
  type LocalDate,
  type UserSettings,
  type UserSettingsUpdate,
} from '@sobr/core';
import { supabase } from '../lib/supabase';

/**
 * Supabase data access. Every call runs under the user's anon session, so RLS
 * guarantees a user only ever touches their own rows. Snake_case DB rows are
 * mapped to the camelCase domain shapes from @sobr/core at this boundary.
 */

const num = (v: unknown): number => Number(v ?? 0);
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

/* ── mappers ─────────────────────────────────────────────────────────────── */

function mapSettings(r: Record<string, unknown>): UserSettings {
  return {
    userId: String(r.user_id),
    winMode: r.win_mode as UserSettings['winMode'],
    dailyLimitUnits: num(r.daily_limit_units),
    currency: String(r.currency),
    timeZone: String(r.time_zone),
    onboarded: Boolean(r.onboarded),
    // default ON to match the column defaults, so a row written before the
    // email migration doesn't read back as opted-out
    emailReminders: r.email_reminders === undefined ? true : Boolean(r.email_reminders),
    emailWeekly: r.email_weekly === undefined ? true : Boolean(r.email_weekly),
    createdAt: r.created_at ? String(r.created_at) : undefined,
    updatedAt: r.updated_at ? String(r.updated_at) : undefined,
  };
}

function mapDrink(r: Record<string, unknown>): Drink {
  return {
    id: String(r.id),
    dailyEntryId: String(r.daily_entry_id),
    presetKey: (r.preset_key as string | null) ?? null,
    name: String(r.name),
    volumeMl: num(r.volume_ml),
    abv: num(r.abv),
    cost: numOrNull(r.cost),
    quantity: num(r.quantity),
    createdAt: r.created_at ? String(r.created_at) : undefined,
  };
}

function mapEntry(r: Record<string, unknown>): DailyEntryWithDrinks {
  const drinks = Array.isArray(r.drinks) ? (r.drinks as Record<string, unknown>[]) : [];
  return {
    id: String(r.id),
    userId: String(r.user_id),
    entryDate: String(r.entry_date) as LocalDate,
    status: r.status as EntryStatus,
    note: (r.note as string | null) ?? null,
    createdAt: r.created_at ? String(r.created_at) : undefined,
    updatedAt: r.updated_at ? String(r.updated_at) : undefined,
    drinks: drinks.map(mapDrink),
  };
}

function mapGrant(r: Record<string, unknown>): FreezeGrant {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    grantedAt: String(r.granted_at),
    grantedForStreak: num(r.granted_for_streak),
    usedAt: (r.used_at as string | null) ?? null,
    usedOnEntryId: (r.used_on_entry_id as string | null) ?? null,
  };
}

/* ── settings ────────────────────────────────────────────────────────────── */

export async function fetchSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettings(data) : null;
}

export async function updateSettings(
  userId: string,
  patch: UserSettingsUpdate,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.winMode !== undefined) row.win_mode = patch.winMode;
  if (patch.dailyLimitUnits !== undefined) row.daily_limit_units = patch.dailyLimitUnits;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.timeZone !== undefined) row.time_zone = patch.timeZone;
  if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
  if (patch.emailReminders !== undefined) row.email_reminders = patch.emailReminders;
  if (patch.emailWeekly !== undefined) row.email_weekly = patch.emailWeekly;

  // Upsert, not update: a plain UPDATE against a missing row "succeeds" with
  // zero rows changed, which made onboarding silently fail to stick for any
  // account created before the on_auth_user_created trigger existed.
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...row }, { onConflict: 'user_id' });
  if (error) throw error;
}

/* ── entries + drinks ────────────────────────────────────────────────────── */

const ENTRY_SELECT = '*, drinks(*)';

export async function fetchEntriesInRange(
  userId: string,
  start: LocalDate,
  end: LocalDate,
): Promise<DailyEntryWithDrinks[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select(ENTRY_SELECT)
    .eq('user_id', userId)
    .gte('entry_date', start)
    .lte('entry_date', end)
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapEntry);
}

export async function fetchAllEntries(userId: string): Promise<DailyEntryWithDrinks[]> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select(ENTRY_SELECT)
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapEntry);
}

export async function fetchEntry(
  userId: string,
  date: LocalDate,
): Promise<DailyEntryWithDrinks | null> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select(ENTRY_SELECT)
    .eq('user_id', userId)
    .eq('entry_date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEntry(data) : null;
}

/** Upsert the day's status (unique on user+date) and return the entry id. */
export async function upsertEntryStatus(
  userId: string,
  date: LocalDate,
  status: EntryStatus,
  note?: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      { user_id: userId, entry_date: date, status, note: note ?? null },
      { onConflict: 'user_id,entry_date' },
    )
    .select('id')
    .single();
  if (error) throw error;
  return String(data.id);
}

/** Replace all drinks for an entry with the given set (simple + correct). */
export async function replaceDrinks(entryId: string, drinks: DrinkInput[]): Promise<void> {
  const del = await supabase.from('drinks').delete().eq('daily_entry_id', entryId);
  if (del.error) throw del.error;
  if (drinks.length === 0) return;
  const rows = drinks.map((d) => ({
    daily_entry_id: entryId,
    preset_key: d.presetKey,
    name: d.name,
    volume_ml: d.volumeMl,
    abv: d.abv,
    cost: d.cost,
    quantity: d.quantity,
  }));
  const ins = await supabase.from('drinks').insert(rows);
  if (ins.error) throw ins.error;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('daily_entries').delete().eq('id', entryId);
  if (error) throw error; // drinks cascade-delete
}

/* ── day photos ──────────────────────────────────────────────────────────── */

export const DAY_PHOTOS_BUCKET = 'day-photos';

/** How long a minted signed URL stays valid. Matches the query cache staleness
 *  below, so a screen never renders a link that expired while it was open. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type DayPhoto = {
  id: string;
  dailyEntryId: string;
  objectPath: string;
  caption: string | null;
  createdAt: string;
  /** Short-lived signed URL, minted per fetch — never persisted. */
  url: string;
};

/**
 * Photos for one day, newest last, each with a fresh signed URL.
 *
 * URLs are signed in a single batch call rather than per row: one round trip
 * instead of N, which matters on a day with a handful of photos.
 */
/**
 * Object-name entropy. Expo Go warns "WebCrypto API is not supported", and
 * `crypto.randomUUID` is missing on some RN runtimes — so fall back rather than
 * throw a TypeError deep inside an upload. This names a storage object; it is
 * not a security token, and the DB's unique(object_path) is the real guard.
 */
function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchDayPhotos(entryId: string): Promise<DayPhoto[]> {
  const { data, error } = await supabase
    .from('day_photos')
    .select('*')
    .eq('daily_entry_id', entryId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const paths = rows.map((r) => String(r.object_path));
  const { data: signed, error: signErr } = await supabase.storage
    .from(DAY_PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (signErr) throw signErr;

  const urlByPath = new Map((signed ?? []).map((s) => [s.path ?? '', s.signedUrl]));
  return rows.map((r) => ({
    id: String(r.id),
    dailyEntryId: String(r.daily_entry_id),
    objectPath: String(r.object_path),
    caption: (r.caption as string | null) ?? null,
    createdAt: String(r.created_at),
    url: urlByPath.get(String(r.object_path)) ?? '',
  }));
}

/**
 * Upload one picked image and record it against the day.
 *
 * The object key starts with the owner's uid because every storage policy
 * checks that first path segment — the path *is* the authorization.
 *
 * On failure after the bytes land, the orphaned object is removed before
 * rethrowing: a storage object with no row is invisible to the app and would
 * silently consume quota forever.
 */
export async function addDayPhoto(params: {
  userId: string;
  entryId: string;
  uri: string;
  mimeType?: string | null;
}): Promise<DayPhoto> {
  const { userId, entryId, uri } = params;
  const mime = params.mimeType?.startsWith('image/') ? params.mimeType : 'image/jpeg';
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const objectPath = `${userId}/${entryId}/${randomId()}.${ext}`;

  // RN's fetch can read a file:// URI into an ArrayBuffer, which avoids pulling
  // the whole image through a base64 string (~33% larger, and it doubles peak
  // memory on big photos).
  const body = await (await fetch(uri)).arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from(DAY_PHOTOS_BUCKET)
    .upload(objectPath, body, { contentType: mime, upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from('day_photos')
    .insert({ daily_entry_id: entryId, user_id: userId, object_path: objectPath })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(DAY_PHOTOS_BUCKET).remove([objectPath]);
    throw error;
  }

  const { data: signed } = await supabase.storage
    .from(DAY_PHOTOS_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  return {
    id: String(data.id),
    dailyEntryId: entryId,
    objectPath,
    caption: null,
    createdAt: String(data.created_at),
    url: signed?.signedUrl ?? '',
  };
}

/**
 * Remove a photo. The row goes first: if the object delete fails we are left
 * with an orphaned object (invisible, costs storage) rather than a row pointing
 * at nothing (a permanent broken thumbnail the user cannot clear).
 */
export async function deleteDayPhoto(photo: {
  id: string;
  objectPath: string;
}): Promise<void> {
  const { error } = await supabase.from('day_photos').delete().eq('id', photo.id);
  if (error) throw error;
  await supabase.storage.from(DAY_PHOTOS_BUCKET).remove([photo.objectPath]);
}

/* ── freeze grants ───────────────────────────────────────────────────────── */

export async function fetchFreezeGrants(userId: string): Promise<FreezeGrant[]> {
  const { data, error } = await supabase
    .from('freeze_grants')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapGrant);
}

/**
 * Award any freeze milestones newly reached by `currentStreak`, respecting the
 * banked cap. Inserts are idempotent via the unique(user_id, granted_for_streak)
 * constraint, so concurrent calls can't double-grant.
 */
export async function reconcileFreezeAwards(
  userId: string,
  currentStreak: number,
  grants: FreezeGrant[],
): Promise<number> {
  const grantedMilestones = new Set(grants.map((g) => g.grantedForStreak));
  const bankedCount = grants.filter((g) => g.usedAt === null).length;
  const toAward = computeFreezeAward({ currentStreak, grantedMilestones, bankedCount });
  if (toAward.length === 0) return 0;
  const rows = toAward.map((m) => ({ user_id: userId, granted_for_streak: m }));
  const { error } = await supabase
    .from('freeze_grants')
    .upsert(rows, { onConflict: 'user_id,granted_for_streak', ignoreDuplicates: true });
  if (error) throw error;
  return toAward.length;
}

/** Spend one banked freeze to protect a slip day (marks the day 'freeze'). */
export async function useFreezeOnDay(
  userId: string,
  date: LocalDate,
  grants: FreezeGrant[],
): Promise<void> {
  const banked = grants.find((g) => g.usedAt === null);
  if (!banked) throw new Error('No freeze tokens available.');
  const entryId = await upsertEntryStatus(userId, date, 'freeze');
  const { error } = await supabase
    .from('freeze_grants')
    .update({ used_at: new Date().toISOString(), used_on_entry_id: entryId })
    .eq('id', banked.id);
  if (error) throw error;
}

/* ── account ─────────────────────────────────────────────────────────────── */

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
