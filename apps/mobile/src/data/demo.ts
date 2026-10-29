import { DRINK_PRESETS } from '@sobr/config';
import {
  addDays,
  todayInTz,
  type DailyEntryWithDrinks,
  type FreezeGrant,
  type UserSettings,
} from '@sobr/core';

/**
 * Dev-only sample data, for screenshots and design review without a backend.
 * Turn on with EXPO_PUBLIC_DEMO_DATA=1 (together with EXPO_PUBLIC_SKIP_AUTH=1);
 * api.ts serves these instead of querying Supabase. Never active in a release
 * build: the flag is __DEV__-gated.
 */
export const DEMO_DATA = __DEV__ && process.env.EXPO_PUBLIC_DEMO_DATA === '1';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_USER = DEMO_USER_ID;
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// Oldest first: a run of clear days ('w', with 'f' a frozen day inside it),
// then a slip ('s'). Ends in the live streak, so Home shows a growing tree and
// the forest has a few trees of different sizes.
const PATTERN = [
  'w'.repeat(5), 's',
  'w'.repeat(12), 's', 's',
  'w'.repeat(4), 's',
  'w'.repeat(20) + 'f' + 'w'.repeat(12), 's',
  'w'.repeat(9), 's',
  'w'.repeat(17), 's',
  'w'.repeat(23),
].join('');

const beer = DRINK_PRESETS[0]!;
const wine = DRINK_PRESETS.find((p) => p.group === 'wine') ?? beer;

let cache: DailyEntryWithDrinks[] | null = null;

export function demoEntries(): DailyEntryWithDrinks[] {
  if (cache) return cache;
  const today = todayInTz(tz);
  const n = PATTERN.length;
  cache = Array.from(PATTERN).map((c, i) => {
    const date = addDays(today, -(n - 1 - i));
    const id = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
    const status = c === 'w' ? 'win' : c === 'f' ? 'freeze' : 'slip';
    const preset = i % 2 ? wine : beer;
    return {
      id,
      userId: DEMO_USER,
      entryDate: date,
      status,
      note: i === n - 1 ? 'Slow evening walk instead of the pub. Felt good.' : null,
      drinks:
        status === 'slip'
          ? [
              {
                id: `${id.slice(0, -1)}d`,
                dailyEntryId: id,
                presetKey: preset.key,
                name: preset.name,
                volumeMl: preset.volumeMl,
                abv: preset.abv,
                cost: 6,
                quantity: 1 + (i % 3),
              },
            ]
          : [],
    };
  });
  return cache;
}

export function demoSettings(): UserSettings {
  return {
    userId: DEMO_USER,
    winMode: 'zero',
    dailyLimitUnits: 2,
    currency: 'USD',
    timeZone: tz,
    onboarded: true,
    emailReminders: true,
    emailWeekly: true,
    pausedAt: null,
    deletionRequestedAt: null,
  };
}

export function demoGrants(): FreezeGrant[] {
  const at = new Date().toISOString();
  return [7, 14].map((m, i) => ({
    id: `00000000-0000-4000-9000-00000000000${i}`,
    userId: DEMO_USER,
    grantedAt: at,
    grantedForStreak: m,
    runStart: null,
    usedAt: null,
    usedOnEntryId: null,
  }));
}
