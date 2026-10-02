import type { LocalDate } from './schemas';
import { compareDates, diffDays } from './date';
import { GROWTH_THRESHOLDS, growthStage, type GrowthStageKey } from './growth';
import { computeStreak, type StreakEntry } from './streak';

/**
 * The forest: trees from past streaks.
 *
 * The home tree grows with the CURRENT streak, so a slip sends it back to a
 * seed. That is the cost of breaking a streak. What it grew to isn't erased,
 * though: every finished run that reached at least a sprout is planted here,
 * so history reads as a forest you've grown, not a list of failures.
 */

export interface StreakRun {
  start: LocalDate;
  end: LocalDate;
  /** Counting days (wins + freezes) in the run. */
  length: number;
}

export interface ForestTree extends StreakRun {
  stage: GrowthStageKey;
}

/** A run must reach the first growth stage past seed to be planted. */
export const FOREST_MIN_DAYS = GROWTH_THRESHOLDS[1]!.minWinDays;

const counts = (s: StreakEntry['status']) => s === 'win' || s === 'freeze';

/** Every maximal run of consecutive counting days, oldest first. */
export function streakRuns(entries: ReadonlyArray<StreakEntry>): StreakRun[] {
  const dates = [...new Set(entries.filter((e) => counts(e.status)).map((e) => e.entryDate))].sort(
    compareDates,
  );
  const runs: StreakRun[] = [];
  for (const d of dates) {
    const last = runs[runs.length - 1];
    if (last && diffDays(d, last.end) === 1) {
      last.end = d;
      last.length += 1;
    } else {
      runs.push({ start: d, end: d, length: 1 });
    }
  }
  return runs;
}

/**
 * Finished runs worth a tree, newest first. The live run (the one the home
 * tree is growing from, per computeStreak's today/yesterday grace) is excluded.
 */
export function forestTrees(entries: ReadonlyArray<StreakEntry>, today: LocalDate): ForestTree[] {
  const { currentStartDate } = computeStreak(entries, today);
  return streakRuns(entries)
    .filter((r) => r.length >= FOREST_MIN_DAYS && r.start !== currentStartDate)
    .map((r) => ({ ...r, stage: growthStage(r.length) }))
    .reverse();
}
