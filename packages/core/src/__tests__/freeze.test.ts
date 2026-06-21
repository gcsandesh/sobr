import { describe, expect, it } from 'vitest';
import {
  MAX_BANKED_FREEZES,
  bankedFreezes,
  canUseFreeze,
  computeFreezeAward,
  milestonesUpTo,
} from '../freeze';

describe('milestonesUpTo', () => {
  it('lists 7-day milestones reached', () => {
    expect(milestonesUpTo(6)).toEqual([]);
    expect(milestonesUpTo(7)).toEqual([7]);
    expect(milestonesUpTo(15)).toEqual([7, 14]);
    expect(milestonesUpTo(21)).toEqual([7, 14, 21]);
  });
});

describe('bankedFreezes', () => {
  it('counts only unused grants', () => {
    expect(
      bankedFreezes([
        { usedAt: null },
        { usedAt: '2026-06-01T00:00:00.000Z' },
        { usedAt: null },
      ]),
    ).toBe(2);
  });
});

describe('canUseFreeze', () => {
  it('requires at least one banked token', () => {
    expect(canUseFreeze(0)).toBe(false);
    expect(canUseFreeze(1)).toBe(true);
  });
});

describe('computeFreezeAward', () => {
  it('awards a newly-reached milestone', () => {
    expect(
      computeFreezeAward({ currentStreak: 7, grantedMilestones: new Set(), bankedCount: 0 }),
    ).toEqual([7]);
  });

  it('does not re-award an already-granted milestone', () => {
    expect(
      computeFreezeAward({ currentStreak: 14, grantedMilestones: new Set([7]), bankedCount: 1 }),
    ).toEqual([14]);
  });

  it('respects the banked cap of 3 (holds extra milestones back)', () => {
    // reached 7,14,21,28 but already holding 3 banked → award nothing new
    const award = computeFreezeAward({
      currentStreak: 28,
      grantedMilestones: new Set(),
      bankedCount: MAX_BANKED_FREEZES,
    });
    expect(award).toEqual([]);
  });

  it('fills only up to the cap when several milestones are pending at once', () => {
    // fresh user somehow at streak 28 with 1 already banked → room for 2 more
    const award = computeFreezeAward({
      currentStreak: 28,
      grantedMilestones: new Set(),
      bankedCount: 1,
    });
    expect(award).toEqual([7, 14]); // 21 and 28 held back (would exceed cap)
  });

  it('defers a held-back milestone until there is room (generous fill)', () => {
    // milestone 7 was never granted (cap was full earlier); now banked dropped to 2
    const award = computeFreezeAward({
      currentStreak: 21,
      grantedMilestones: new Set([14, 21]),
      bankedCount: 2,
    });
    expect(award).toEqual([7]);
  });
});
