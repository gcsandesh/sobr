import { describe, expect, it } from 'vitest';
import { growthProgress, growthStage } from '../growth.js';

describe('growthStage thresholds (0/3/7/14/30/60)', () => {
  const cases: Array<[number, string]> = [
    [0, 'seed'],
    [2, 'seed'],
    [3, 'sprout'],
    [6, 'sprout'],
    [7, 'sapling'],
    [13, 'sapling'],
    [14, 'young_tree'],
    [29, 'young_tree'],
    [30, 'tree'],
    [59, 'tree'],
    [60, 'grove'],
    [200, 'grove'],
  ];
  it.each(cases)('%i win days → %s', (winDays, stage) => {
    expect(growthStage(winDays)).toBe(stage);
  });

  it('floors fractional and clamps negative win days to seed', () => {
    expect(growthStage(-5)).toBe('seed');
    expect(growthStage(3.9)).toBe('sprout');
  });
});

describe('growthProgress', () => {
  it('reports the next stage and remaining win days', () => {
    const p = growthProgress(5); // sprout band is 3..7
    expect(p.stage).toBe('sprout');
    expect(p.nextStageAt).toBe(7);
    expect(p.winDaysToNext).toBe(2);
    expect(p.progressToNext).toBeCloseTo((5 - 3) / (7 - 3), 10); // 0.5
  });

  it('is fully complete with no next stage at grove', () => {
    const p = growthProgress(80);
    expect(p.stage).toBe('grove');
    expect(p.nextStageAt).toBeNull();
    expect(p.winDaysToNext).toBeNull();
    expect(p.progressToNext).toBe(1);
  });

  it('is 0 progress exactly at the start of a band', () => {
    const p = growthProgress(14); // start of young_tree
    expect(p.stage).toBe('young_tree');
    expect(p.progressToNext).toBe(0);
  });
});
