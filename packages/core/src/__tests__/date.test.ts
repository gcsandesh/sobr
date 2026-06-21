import { describe, expect, it } from 'vitest';
import {
  addDays,
  diffDays,
  endOfMonth,
  enumerateDates,
  isWithin,
  localDateString,
  startOfMonth,
  todayInTz,
} from '../date';

describe('localDateString — timezone correctness', () => {
  it('maps an instant to the correct LOCAL civil day', () => {
    // 2026-06-21T18:00:00Z is 23:45 on the 21st in Kathmandu (+05:45)
    const instant = new Date('2026-06-21T18:00:00Z');
    expect(localDateString(instant, 'Asia/Kathmandu')).toBe('2026-06-21');
  });

  it('rolls to the next local day after local midnight (the key edge case)', () => {
    // 2026-06-21T19:00:00Z is 00:45 on the 22nd in Kathmandu (+05:45)
    const instant = new Date('2026-06-21T19:00:00Z');
    expect(localDateString(instant, 'Asia/Kathmandu')).toBe('2026-06-22');
  });

  it('can land on a different day than UTC for western zones', () => {
    // 2026-06-21T02:00:00Z is still 2026-06-20 in Los Angeles (-07:00)
    const instant = new Date('2026-06-21T02:00:00Z');
    expect(localDateString(instant, 'America/Los_Angeles')).toBe('2026-06-20');
    expect(localDateString(instant, 'UTC')).toBe('2026-06-21');
  });

  it('todayInTz delegates to localDateString', () => {
    const now = new Date('2026-06-21T12:00:00Z');
    expect(todayInTz('UTC', now)).toBe('2026-06-21');
  });
});

describe('addDays / diffDays', () => {
  it('adds and subtracts across month boundaries', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDays('2026-06-01', -1)).toBe('2026-05-31');
  });
  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('handles a leap day', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });
  it('diffDays is signed and DST-proof (UTC anchored)', () => {
    // US DST springs forward 2026-03-08; the civil-day diff is still exact.
    expect(diffDays('2026-03-09', '2026-03-07')).toBe(2);
    expect(diffDays('2026-06-21', '2026-06-21')).toBe(0);
    expect(diffDays('2026-06-20', '2026-06-21')).toBe(-1);
  });
});

describe('month helpers', () => {
  it('startOfMonth / endOfMonth', () => {
    expect(startOfMonth('2026-06-21')).toBe('2026-06-01');
    expect(endOfMonth('2026-06-21')).toBe('2026-06-30');
    expect(endOfMonth('2026-02-15')).toBe('2026-02-28');
    expect(endOfMonth('2024-02-15')).toBe('2024-02-29'); // leap year
  });
  it('isWithin is inclusive', () => {
    expect(isWithin('2026-06-01', '2026-06-01', '2026-06-30')).toBe(true);
    expect(isWithin('2026-06-30', '2026-06-01', '2026-06-30')).toBe(true);
    expect(isWithin('2026-07-01', '2026-06-01', '2026-06-30')).toBe(false);
  });
});

describe('enumerateDates', () => {
  it('lists inclusive ascending dates', () => {
    expect(enumerateDates('2026-06-19', '2026-06-22')).toEqual([
      '2026-06-19',
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
    ]);
  });
  it('returns [] when start is after end', () => {
    expect(enumerateDates('2026-06-22', '2026-06-19')).toEqual([]);
  });
});
