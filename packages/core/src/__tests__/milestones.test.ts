import { describe, expect, it } from 'vitest';
import { MILESTONES, highestMilestone, milestoneProgress, nextMilestone } from '../milestones';

describe('milestones', () => {
  it('is sorted ascending by days', () => {
    const days = MILESTONES.map((m) => m.days);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('none reached at 0 days', () => {
    expect(highestMilestone(0)).toBeNull();
    expect(nextMilestone(0)?.days).toBe(1);
    expect(milestoneProgress(0).every((m) => !m.reached)).toBe(true);
  });

  it('reaches milestones at exact thresholds', () => {
    expect(highestMilestone(1)?.days).toBe(1);
    expect(highestMilestone(6)?.days).toBe(3);
    expect(highestMilestone(7)?.days).toBe(7);
    expect(nextMilestone(7)?.days).toBe(14);
  });

  it('all reached at 365+', () => {
    expect(highestMilestone(400)?.days).toBe(365);
    expect(nextMilestone(400)).toBeNull();
    expect(milestoneProgress(365).every((m) => m.reached)).toBe(true);
  });
});
