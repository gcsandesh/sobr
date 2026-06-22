import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  allTimeStats,
  bankedFreezes,
  computeStreak,
  type DailyEntryWithDrinks,
  type DrinkInput,
  type EntryStatus,
  type LocalDate,
  growthProgress,
  growthStage,
  monthlyAggregates,
  todayInTz,
  totalWinDays,
  type UserSettingsUpdate,
} from '@sobr/core';
import * as api from './api';
import { useSession } from './SessionProvider';

/** The device's IANA time zone, used as the default until the user sets one. */
export const deviceTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const keys = {
  settings: (uid: string) => ['settings', uid] as const,
  allEntries: (uid: string) => ['entries', 'all', uid] as const,
  entry: (uid: string, date: string) => ['entry', uid, date] as const,
  grants: (uid: string) => ['freezeGrants', uid] as const,
};

/**
 * The signed-in user id, or null. Never throws at render time — mutation hooks
 * mount on screens that may briefly render before the routing gate redirects an
 * unauthenticated user away, so the "must be signed in" check belongs in the
 * mutation function, not the hook body.
 */
function useUid(): string | null {
  return useSession().userId;
}

function requireUid(uid: string | null): string {
  if (!uid) throw new Error('You need to be signed in to do that.');
  return uid;
}

/* ── queries ─────────────────────────────────────────────────────────────── */

export function useSettings() {
  const { userId } = useSession();
  return useQuery({
    queryKey: keys.settings(userId ?? 'anon'),
    queryFn: () => api.fetchSettings(userId!),
    enabled: !!userId,
  });
}

export function useTimeZone(): string {
  const settings = useSettings();
  return settings.data?.timeZone ?? deviceTimeZone();
}

export function useAllEntries() {
  const { userId } = useSession();
  return useQuery({
    queryKey: keys.allEntries(userId ?? 'anon'),
    queryFn: () => api.fetchAllEntries(userId!),
    enabled: !!userId,
  });
}

export function useDayEntry(date: LocalDate) {
  const { userId } = useSession();
  return useQuery({
    queryKey: keys.entry(userId ?? 'anon', date),
    queryFn: () => api.fetchEntry(userId!, date),
    enabled: !!userId,
  });
}

export function useFreezeGrants() {
  const { userId } = useSession();
  return useQuery({
    queryKey: keys.grants(userId ?? 'anon'),
    queryFn: () => api.fetchFreezeGrants(userId!),
    enabled: !!userId,
  });
}

/**
 * Everything the home screen needs, derived from cached entries + grants.
 * All numbers come straight from the tested @sobr/core logic.
 */
export function useHomeStats() {
  const tz = useTimeZone();
  const entriesQ = useAllEntries();
  const grantsQ = useFreezeGrants();

  const entries = entriesQ.data ?? [];
  const grants = grantsQ.data ?? [];
  const today = todayInTz(tz);

  const streak = computeStreak(
    entries.map((e) => ({ entryDate: e.entryDate, status: e.status })),
    today,
  );
  const lifetimeWins = totalWinDays(entries);
  const stage = growthStage(lifetimeWins);
  const progress = growthProgress(lifetimeWins);
  const banked = bankedFreezes(grants);

  return {
    isLoading: entriesQ.isLoading || grantsQ.isLoading,
    isError: entriesQ.isError || grantsQ.isError,
    refetch: () => {
      void entriesQ.refetch();
      void grantsQ.refetch();
    },
    hasAnyData: entries.length > 0,
    today,
    streak,
    lifetimeWins,
    stage,
    progress,
    bankedFreezes: banked,
    monthly: monthlyAggregates(entries, today),
    allTime: allTimeStats(entries, streak.longest),
  };
}

/* ── mutations ───────────────────────────────────────────────────────────── */

function useInvalidateAll() {
  const qc = useQueryClient();
  const uid = useUid();
  return async () => {
    if (!uid) return;
    await Promise.all([
      qc.invalidateQueries({ queryKey: keys.allEntries(uid) }),
      qc.invalidateQueries({ queryKey: keys.grants(uid) }),
      qc.invalidateQueries({ queryKey: ['entry', uid] }),
    ]);
  };
}

/**
 * Optimistically write an entry into the cache (the today view, calendar, and
 * all derived home stats update instantly), returning a snapshot for rollback.
 * This is what makes logging feel instant and tolerate a flaky connection.
 */
type EntrySnapshot = {
  prevAll: DailyEntryWithDrinks[] | undefined;
  prevEntry: DailyEntryWithDrinks | null | undefined;
};

function writeOptimisticEntry(
  qc: QueryClient,
  uid: string,
  date: LocalDate,
  status: EntryStatus,
  drinks: DrinkInput[],
  note: string | null,
): EntrySnapshot {
  const prevAll = qc.getQueryData<DailyEntryWithDrinks[]>(keys.allEntries(uid));
  const prevEntry = qc.getQueryData<DailyEntryWithDrinks | null>(keys.entry(uid, date));
  const id = prevEntry?.id ?? `optimistic-${date}`;
  const entry: DailyEntryWithDrinks = {
    id,
    userId: uid,
    entryDate: date,
    status,
    note,
    drinks: drinks.map((d, i) => ({
      id: `opt-${date}-${i}`,
      dailyEntryId: id,
      presetKey: d.presetKey,
      name: d.name,
      volumeMl: d.volumeMl,
      abv: d.abv,
      cost: d.cost,
      quantity: d.quantity,
    })),
  };
  qc.setQueryData(keys.entry(uid, date), entry);
  qc.setQueryData<DailyEntryWithDrinks[]>(keys.allEntries(uid), (old) => {
    const list = old ? [...old] : [];
    const idx = list.findIndex((e) => e.entryDate === date);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    return list.sort((a, b) => (a.entryDate < b.entryDate ? -1 : 1));
  });
  return { prevAll, prevEntry };
}

function restoreEntry(qc: QueryClient, uid: string, date: LocalDate, snap: EntrySnapshot) {
  qc.setQueryData(keys.allEntries(uid), snap.prevAll);
  qc.setQueryData(keys.entry(uid, date), snap.prevEntry);
}

/** Save a day's status + drinks, then award any newly-earned freeze tokens. */
export function useSaveDay() {
  const uid = useUid();
  const tz = useTimeZone();
  const qc = useQueryClient();
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: {
      date: LocalDate;
      status: EntryStatus;
      drinks: DrinkInput[];
      note?: string | null;
    }) => {
      const u = requireUid(uid);
      const entryId = await api.upsertEntryStatus(u, input.date, input.status, input.note);
      await api.replaceDrinks(entryId, input.drinks);
      // Recompute streak from fresh history and reconcile freeze awards.
      const entries = await api.fetchAllEntries(u);
      const grants = await api.fetchFreezeGrants(u);
      const streak = computeStreak(
        entries.map((e) => ({ entryDate: e.entryDate, status: e.status })),
        todayInTz(tz),
      );
      await api.reconcileFreezeAwards(u, streak.current, grants);
    },
    onMutate: async (input) => {
      if (!uid) return undefined;
      await qc.cancelQueries({ queryKey: keys.allEntries(uid) });
      await qc.cancelQueries({ queryKey: keys.entry(uid, input.date) });
      return writeOptimisticEntry(qc, uid, input.date, input.status, input.drinks, input.note ?? null);
    },
    onError: (_e, input, ctx) => {
      if (uid && ctx) restoreEntry(qc, uid, input.date, ctx);
    },
    onSettled: () => invalidate(),
  });
}

export function useDeleteDay() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (entryId: string) => api.deleteEntry(entryId),
    onSuccess: invalidate,
  });
}

export function useUseFreeze() {
  const uid = useUid();
  const qc = useQueryClient();
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (date: LocalDate) => {
      const u = requireUid(uid);
      const grants = await api.fetchFreezeGrants(u);
      await api.useFreezeOnDay(u, date, grants);
    },
    onMutate: async (date) => {
      if (!uid) return undefined;
      await qc.cancelQueries({ queryKey: keys.allEntries(uid) });
      await qc.cancelQueries({ queryKey: keys.entry(uid, date) });
      const prevEntry = qc.getQueryData<DailyEntryWithDrinks | null>(keys.entry(uid, date));
      const drinks: DrinkInput[] = (prevEntry?.drinks ?? []).map((d) => ({
        presetKey: d.presetKey,
        name: d.name,
        volumeMl: d.volumeMl,
        abv: d.abv,
        cost: d.cost,
        quantity: d.quantity,
      }));
      return writeOptimisticEntry(qc, uid, date, 'freeze', drinks, prevEntry?.note ?? null);
    },
    onError: (_e, date, ctx) => {
      if (uid && ctx) restoreEntry(qc, uid, date, ctx);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateSettings() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UserSettingsUpdate) => api.updateSettings(requireUid(uid), patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings(uid ?? 'anon') }),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api.deleteAccount() });
}
