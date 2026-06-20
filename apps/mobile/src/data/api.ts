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
  const { error } = await supabase.from('user_settings').update(row).eq('user_id', userId);
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
