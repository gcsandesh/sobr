import type { FreezeGrant } from './schemas.js';

/**
 * Freeze tokens — the safety net that makes streaks sustainable instead of
 * all-or-nothing. One token is earned per completed 7-day streak milestone
 * (7, 14, 21, …). The bank is capped at 3: while full, a freshly-reached
 * milestone is held back rather than lost, and fills the bank the moment you
 * spend a token and have room again (a deliberately generous, on-brand choice
 * for a supportive app — you never feel robbed of a token you earned).
 *
 * `grantedForStreak` on each grant records the milestone that earned it, so the
 * same milestone is never granted twice even as the streak keeps growing.
 */

export const FREEZE_INTERVAL = 7;
export const MAX_BANKED_FREEZES = 3;

/** Multiples of 7 up to and including `streak`, e.g. 15 -> [7, 14]. */
export function milestonesUpTo(streak: number): number[] {
  const out: number[] = [];
  for (let m = FREEZE_INTERVAL; m <= streak; m += FREEZE_INTERVAL) out.push(m);
  return out;
}

/** Count of currently-banked (unused) tokens. */
export function bankedFreezes(grants: ReadonlyArray<Pick<FreezeGrant, 'usedAt'>>): number {
  return grants.reduce((n, g) => (g.usedAt === null ? n + 1 : n), 0);
}

export function canUseFreeze(bankedCount: number): boolean {
  return bankedCount > 0;
}

export interface FreezeAwardInput {
  currentStreak: number;
  /** Milestones already granted (from existing freeze_grants.grantedForStreak). */
  grantedMilestones: ReadonlySet<number>;
  /** Currently banked (unused) token count. */
  bankedCount: number;
}

/**
 * Pure decision: which new milestones should be granted right now. The service
 * layer turns each returned milestone into a freeze_grants row. Respects the
 * banked cap — once at MAX_BANKED, further milestones are skipped (not queued).
 */
export function computeFreezeAward(input: FreezeAwardInput): number[] {
  const { currentStreak, grantedMilestones } = input;
  let banked = input.bankedCount;
  const toAward: number[] = [];
  for (const milestone of milestonesUpTo(currentStreak)) {
    if (grantedMilestones.has(milestone)) continue;
    if (banked >= MAX_BANKED_FREEZES) break;
    toAward.push(milestone);
    banked += 1;
  }
  return toAward;
}
