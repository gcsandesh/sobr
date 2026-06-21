import type { EntryStatus, LocalDate } from './schemas';
import { addDays, compareDates, diffDays } from './date';

/**
 * Streak computation — the single most bug-prone piece (off-by-one, midnight,
 * grace-day handling), so it's pure and heavily tested.
 *
 * Counting day = a day whose status is `win` OR `freeze` (a freeze protects the
 * run as if it were a win). A `slip` or a day with NO entry breaks the run.
 *
 * Current streak: the consecutive run of counting days ending TODAY or YESTERDAY.
 *   The one-day grace (yesterday) exists so an as-yet-unlogged "today" doesn't
 *   prematurely zero a live streak. A slip *today* still breaks it immediately.
 *
 * Longest streak: the longest consecutive run of counting days across all history.
 *   It is derived from history, so it never decreases on its own.
 */

export interface StreakEntry {
  entryDate: LocalDate;
  status: EntryStatus;
}

export interface StreakResult {
  current: number;
  longest: number;
  /** First date of the current run (null when current is 0). */
  currentStartDate: LocalDate | null;
}

const isCounting = (status: EntryStatus | undefined): boolean =>
  status === 'win' || status === 'freeze';

export function computeStreak(entries: ReadonlyArray<StreakEntry>, today: LocalDate): StreakResult {
  const byDate = new Map<LocalDate, EntryStatus>();
  for (const e of entries) byDate.set(e.entryDate, e.status);

  // ---- current ----
  const yesterday = addDays(today, -1);
  let anchor: LocalDate | null = null;
  if (isCounting(byDate.get(today))) {
    anchor = today;
  } else if (byDate.get(today) === undefined && isCounting(byDate.get(yesterday))) {
    // today not logged yet → grace: a run ending yesterday is still alive.
    anchor = yesterday;
  }
  // If today is a slip (or today empty and yesterday is slip/empty), anchor stays null.

  let current = 0;
  let currentStartDate: LocalDate | null = null;
  if (anchor) {
    let cursor = anchor;
    while (isCounting(byDate.get(cursor))) {
      current += 1;
      currentStartDate = cursor;
      cursor = addDays(cursor, -1);
    }
  }

  // ---- longest ----
  const countingDates = entries
    .filter((e) => isCounting(e.status))
    .map((e) => e.entryDate)
    .sort(compareDates);

  let longest = 0;
  let run = 0;
  let prev: LocalDate | null = null;
  for (const d of countingDates) {
    if (prev !== null && diffDays(d, prev) === 1) {
      run += 1;
    } else if (prev !== null && diffDays(d, prev) === 0) {
      // duplicate date (shouldn't happen given the unique constraint) — ignore.
      continue;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  return { current, longest, currentStartDate };
}
