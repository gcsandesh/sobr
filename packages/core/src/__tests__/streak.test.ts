import { describe, expect, it } from 'vitest';
import { computeStreak, type StreakEntry } from '../streak';
import type { EntryStatus, LocalDate } from '../schemas';

const e = (entryDate: LocalDate, status: EntryStatus): StreakEntry => ({ entryDate, status });

describe('computeStreak — current', () => {
  it('is 0 with no history', () => {
    expect(computeStreak([], '2026-06-21')).toEqual({
      current: 0,
      longest: 0,
      currentStartDate: null,
    });
  });

  it('counts consecutive wins ending today', () => {
    const entries = [e('2026-06-19', 'win'), e('2026-06-20', 'win'), e('2026-06-21', 'win')];
    const r = computeStreak(entries, '2026-06-21');
    expect(r.current).toBe(3);
    expect(r.currentStartDate).toBe('2026-06-19');
  });

  it('grace day: an unlogged today keeps a streak ending yesterday alive', () => {
    const entries = [e('2026-06-19', 'win'), e('2026-06-20', 'win')];
    expect(computeStreak(entries, '2026-06-21').current).toBe(2);
  });

  it('a slip TODAY breaks the streak immediately (no grace)', () => {
    const entries = [e('2026-06-19', 'win'), e('2026-06-20', 'win'), e('2026-06-21', 'slip')];
    expect(computeStreak(entries, '2026-06-21').current).toBe(0);
  });

  it('two days unlogged kills the streak (grace is one day only)', () => {
    const entries = [e('2026-06-18', 'win'), e('2026-06-19', 'win')];
    // today = 21, yesterday = 20 has no entry → no anchor
    expect(computeStreak(entries, '2026-06-21').current).toBe(0);
  });

  it('a gap in the middle stops the current run', () => {
    const entries = [e('2026-06-17', 'win'), e('2026-06-19', 'win'), e('2026-06-20', 'win'), e('2026-06-21', 'win')];
    // 18th missing → current run is 19,20,21 = 3
    expect(computeStreak(entries, '2026-06-21').current).toBe(3);
  });

  it('freeze days count toward the streak', () => {
    const entries = [
      e('2026-06-19', 'win'),
      e('2026-06-20', 'freeze'),
      e('2026-06-21', 'win'),
    ];
    expect(computeStreak(entries, '2026-06-21').current).toBe(3);
  });
});

describe('computeStreak — longest', () => {
  it('finds the longest run across history', () => {
    const entries = [
      // run of 4
      e('2026-05-01', 'win'),
      e('2026-05-02', 'win'),
      e('2026-05-03', 'freeze'),
      e('2026-05-04', 'win'),
      // break
      e('2026-05-05', 'slip'),
      // run of 2
      e('2026-05-06', 'win'),
      e('2026-05-07', 'win'),
    ];
    const r = computeStreak(entries, '2026-06-21');
    expect(r.longest).toBe(4);
    expect(r.current).toBe(0); // nothing recent
  });

  it('longest is never less than current', () => {
    const entries = [e('2026-06-19', 'win'), e('2026-06-20', 'win'), e('2026-06-21', 'win')];
    const r = computeStreak(entries, '2026-06-21');
    expect(r.longest).toBeGreaterThanOrEqual(r.current);
    expect(r.longest).toBe(3);
  });

  it('handles unsorted input', () => {
    const entries = [e('2026-06-21', 'win'), e('2026-06-19', 'win'), e('2026-06-20', 'win')];
    const r = computeStreak(entries, '2026-06-21');
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
  });

  it('crosses a month boundary correctly', () => {
    const entries = [
      e('2026-05-30', 'win'),
      e('2026-05-31', 'win'),
      e('2026-06-01', 'win'),
    ];
    const r = computeStreak(entries, '2026-06-01');
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
  });
});
