import type { DailyEntryWithDrinks, LocalDate } from './schemas';
import { endOfMonth, isWithin, startOfMonth } from './date';
import { totalCost, totalUnits } from './units';

/**
 * Read-time aggregates for the stats screens. All derived from entries+drinks,
 * never stored — so they can't drift from the underlying logs.
 */

type EntryLike = Pick<DailyEntryWithDrinks, 'entryDate' | 'status' | 'drinks'>;

export interface PeriodStats {
  wins: number;
  slips: number;
  freezes: number;
  /** Days on which at least one drink was logged (units > 0). */
  drinkingDays: number;
  totalUnits: number;
  totalSpent: number;
  /** totalUnits / drinkingDays, or 0 when there were no drinking days. */
  avgUnitsPerDrinkingDay: number;
}

function summarize(entries: ReadonlyArray<EntryLike>): PeriodStats {
  let wins = 0;
  let slips = 0;
  let freezes = 0;
  let drinkingDays = 0;
  let units = 0;
  let spent = 0;

  for (const e of entries) {
    if (e.status === 'win') wins += 1;
    else if (e.status === 'slip') slips += 1;
    else if (e.status === 'freeze') freezes += 1;

    const dayUnits = totalUnits(e.drinks);
    if (dayUnits > 0) drinkingDays += 1;
    units += dayUnits;
    spent += totalCost(e.drinks);
  }

  return {
    wins,
    slips,
    freezes,
    drinkingDays,
    totalUnits: units,
    totalSpent: spent,
    avgUnitsPerDrinkingDay: drinkingDays > 0 ? units / drinkingDays : 0,
  };
}

/** Aggregate stats for the calendar month containing `anchor`. */
export function monthlyAggregates(
  entries: ReadonlyArray<EntryLike>,
  anchor: LocalDate,
): PeriodStats {
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  return summarize(entries.filter((e) => isWithin(e.entryDate, start, end)));
}

export interface AllTimeStats extends PeriodStats {
  longestStreak: number;
  totalWinDays: number;
}

/** All-time stats. `longestStreak` comes from computeStreak (history-derived). */
export function allTimeStats(
  entries: ReadonlyArray<EntryLike>,
  longestStreak: number,
): AllTimeStats {
  const base = summarize(entries);
  return {
    ...base,
    longestStreak,
    totalWinDays: base.wins,
  };
}

/** Total lifetime win days — drives the growth tree. */
export function totalWinDays(entries: ReadonlyArray<Pick<EntryLike, 'status'>>): number {
  return entries.reduce((n, e) => (e.status === 'win' ? n + 1 : n), 0);
}
