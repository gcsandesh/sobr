import type { DailyEntry } from './schemas';

/**
 * Mood vs. drinking: the average mood (1 rough … 5 great) on clear days
 * (wins and frozen days) against days with a slip. Only days with a mood
 * logged count. The point is a gentle mirror ("you feel better on clear
 * days"), so averages are rounded to one decimal and null when there's no data.
 */
export interface MoodSide {
  avg: number | null;
  days: number;
}

export interface MoodSplit {
  clear: MoodSide;
  slip: MoodSide;
}

export function moodByDayType(
  entries: ReadonlyArray<Pick<DailyEntry, 'status' | 'mood'>>,
): MoodSplit {
  const sums = { clear: { total: 0, days: 0 }, slip: { total: 0, days: 0 } };
  for (const e of entries) {
    if (e.mood == null) continue;
    const side = e.status === 'slip' ? sums.slip : sums.clear;
    side.total += e.mood;
    side.days += 1;
  }
  const out = (s: { total: number; days: number }): MoodSide => ({
    avg: s.days ? Math.round((s.total / s.days) * 10) / 10 : null,
    days: s.days,
  });
  return { clear: out(sums.clear), slip: out(sums.slip) };
}
