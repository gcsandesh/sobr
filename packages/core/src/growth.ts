/**
 * Growth stage — the home-screen tree's emotional anchor. Keyed to LIFETIME win
 * days (not streak length) so a single slip never visibly regresses the tree.
 *
 * Thresholds (win days): 0 / 3 / 7 / 14 / 30 / 60.
 * Display copy + visuals for each stage live in @sobr/config/growth, keyed by the
 * same stage keys defined here.
 */

export type GrowthStageKey =
  | 'seed'
  | 'sprout'
  | 'sapling'
  | 'young_tree'
  | 'tree'
  | 'grove';

export interface GrowthThreshold {
  key: GrowthStageKey;
  minWinDays: number;
}

/** Canonical thresholds, ascending. This is the numeric source of truth. */
export const GROWTH_THRESHOLDS: GrowthThreshold[] = [
  { key: 'seed', minWinDays: 0 },
  { key: 'sprout', minWinDays: 3 },
  { key: 'sapling', minWinDays: 7 },
  { key: 'young_tree', minWinDays: 14 },
  { key: 'tree', minWinDays: 30 },
  { key: 'grove', minWinDays: 60 },
];

export interface GrowthProgress {
  stage: GrowthStageKey;
  stageIndex: number;
  totalWinDays: number;
  /** Win days at which the next stage unlocks, or null at the final stage. */
  nextStageAt: number | null;
  /** Win days still needed for the next stage, or null at the final stage. */
  winDaysToNext: number | null;
  /** 0..1 progress through the CURRENT stage band (1 at the final stage). */
  progressToNext: number;
}

/** Resolve the current stage key for a lifetime win-day count. */
export function growthStage(totalWinDays: number): GrowthStageKey {
  const n = Math.max(0, Math.floor(totalWinDays));
  let current: GrowthStageKey = 'seed';
  for (const t of GROWTH_THRESHOLDS) {
    if (n >= t.minWinDays) current = t.key;
    else break;
  }
  return current;
}

/** Full progress detail for the home tree + progress ring. */
export function growthProgress(totalWinDays: number): GrowthProgress {
  const n = Math.max(0, Math.floor(totalWinDays));
  let index = 0;
  for (let i = 0; i < GROWTH_THRESHOLDS.length; i++) {
    if (n >= GROWTH_THRESHOLDS[i]!.minWinDays) index = i;
    else break;
  }
  const current = GROWTH_THRESHOLDS[index]!;
  const next = GROWTH_THRESHOLDS[index + 1] ?? null;

  if (!next) {
    return {
      stage: current.key,
      stageIndex: index,
      totalWinDays: n,
      nextStageAt: null,
      winDaysToNext: null,
      progressToNext: 1,
    };
  }

  const band = next.minWinDays - current.minWinDays;
  const into = n - current.minWinDays;
  return {
    stage: current.key,
    stageIndex: index,
    totalWinDays: n,
    nextStageAt: next.minWinDays,
    winDaysToNext: Math.max(0, next.minWinDays - n),
    progressToNext: band > 0 ? Math.min(1, Math.max(0, into / band)) : 0,
  };
}
