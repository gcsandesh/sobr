import { describe, expect, it } from 'vitest';
import { FOREST_MIN_DAYS, forestTrees, streakRuns } from '../forest';
import type { StreakEntry } from '../streak';
import type { EntryStatus, LocalDate } from '../schemas';

/** Build consecutive days from `start`, one status char each: w=win f=freeze s=slip .=none */
function days(start: string, pattern: string): StreakEntry[] {
  const out: StreakEntry[] = [];
  const base = new Date(`${start}T00:00:00Z`).getTime();
  [...pattern].forEach((c, i) => {
    if (c === '.') return;
    const status: EntryStatus = c === 'w' ? 'win' : c === 'f' ? 'freeze' : 'slip';
    const d = new Date(base + i * 86_400_000).toISOString().slice(0, 10) as LocalDate;
    out.push({ entryDate: d, status });
  });
  return out;
}

describe('streakRuns', () => {
  it('splits on slips and gaps, counts freezes, oldest first', () => {
    const runs = streakRuns(days('2026-09-01', 'wwwswfw.ww'));
    expect(runs).toEqual([
      { start: '2026-09-01', end: '2026-09-03', length: 3 },
      { start: '2026-09-05', end: '2026-09-07', length: 3 },
      { start: '2026-09-09', end: '2026-09-10', length: 2 },
    ]);
  });

  it('is empty with no counting days', () => {
    expect(streakRuns(days('2026-09-01', 'ss.s'))).toEqual([]);
  });
});

describe('forestTrees', () => {
  it('plants finished runs that reached a sprout, newest first, with their stage', () => {
    // 8-day run (sapling), slip, 2-day run (too short), slip, 3-day run (sprout), slip
    const entries = days('2026-08-01', 'wwwwwwwwswwswwws');
    const trees = forestTrees(entries, '2026-08-16');
    expect(trees.map((t) => [t.start, t.length, t.stage])).toEqual([
      ['2026-08-13', 3, 'sprout'],
      ['2026-08-01', 8, 'sapling'],
    ]);
  });

  it('leaves out the live run, including one alive through the yesterday grace', () => {
    const entries = days('2026-09-01', 'wwwswwww'); // last win is 09-08
    expect(forestTrees(entries, '2026-09-08').map((t) => t.length)).toEqual([3]);
    // today (09-09) not logged yet: the 4-day run is still live
    expect(forestTrees(entries, '2026-09-09').map((t) => t.length)).toEqual([3]);
    // a day later with nothing logged, it has ended and gets planted
    expect(forestTrees(entries, '2026-09-10').map((t) => t.length)).toEqual([4, 3]);
  });

  it('uses the sprout threshold as the minimum', () => {
    expect(FOREST_MIN_DAYS).toBe(3);
  });
});
