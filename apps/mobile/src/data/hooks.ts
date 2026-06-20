import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  allTimeStats,
  bankedFreezes,
  computeStreak,
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

function useUid(): string {
  const { userId } = useSession();
  if (!userId) throw new Error('No authenticated user');
  return userId;
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
    await Promise.all([
      qc.invalidateQueries({ queryKey: keys.allEntries(uid) }),
      qc.invalidateQueries({ queryKey: keys.grants(uid) }),
      qc.invalidateQueries({ queryKey: ['entry', uid] }),
    ]);
  };
}

/** Save a day's status + drinks, then award any newly-earned freeze tokens. */
export function useSaveDay() {
  const uid = useUid();
  const tz = useTimeZone();
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: {
      date: LocalDate;
      status: EntryStatus;
      drinks: DrinkInput[];
      note?: string | null;
    }) => {
      const entryId = await api.upsertEntryStatus(uid, input.date, input.status, input.note);
      await api.replaceDrinks(entryId, input.drinks);
      // Recompute streak from fresh history and reconcile freeze awards.
      const entries = await api.fetchAllEntries(uid);
      const grants = await api.fetchFreezeGrants(uid);
      const streak = computeStreak(
        entries.map((e) => ({ entryDate: e.entryDate, status: e.status })),
        todayInTz(tz),
      );
      await api.reconcileFreezeAwards(uid, streak.current, grants);
    },
    onSuccess: invalidate,
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
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (date: LocalDate) => {
      const grants = await api.fetchFreezeGrants(uid);
      await api.useFreezeOnDay(uid, date, grants);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateSettings() {
  const uid = useUid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UserSettingsUpdate) => api.updateSettings(uid, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings(uid) }),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api.deleteAccount() });
}
