import { describe, expect, it } from 'vitest';
import { determineStatus, evaluateStatus } from '../win';

const beer = { volumeMl: 330, abv: 5, quantity: 1 }; // 1.65 units

describe('determineStatus — zero mode', () => {
  it('is a win with no drinks', () => {
    expect(determineStatus({ mode: 'zero', drinks: [] })).toBe('win');
  });
  it('is a slip with any drink (even a 0% one)', () => {
    expect(determineStatus({ mode: 'zero', drinks: [beer] })).toBe('slip');
    expect(determineStatus({ mode: 'zero', drinks: [{ volumeMl: 500, abv: 0, quantity: 1 }] })).toBe('slip');
  });
});

describe('determineStatus — limit mode', () => {
  it('is a win when under the limit', () => {
    expect(determineStatus({ mode: 'limit', drinks: [beer], dailyLimitUnits: 2 })).toBe('win');
  });
  it('is a win exactly AT the limit (boundary inclusive)', () => {
    // two 30ml @ 40% shots = 2.4... use exact: 200ml @ 10% = 2.0 units, limit 2
    expect(
      determineStatus({ mode: 'limit', drinks: [{ volumeMl: 200, abv: 10, quantity: 1 }], dailyLimitUnits: 2 }),
    ).toBe('win');
  });
  it('is a slip when over the limit', () => {
    expect(
      determineStatus({ mode: 'limit', drinks: [beer, beer], dailyLimitUnits: 2 }), // 3.3 > 2
    ).toBe('slip');
  });
  it('is a win with no drinks (0 ≤ limit)', () => {
    expect(determineStatus({ mode: 'limit', drinks: [], dailyLimitUnits: 2 })).toBe('win');
  });
  it('survives floating-point dust at the boundary', () => {
    // 1.65 + 0.35 should count as exactly 2.0, not 2.0000000001 > 2
    const drinks = [
      { volumeMl: 330, abv: 5, quantity: 1 }, // 1.65
      { volumeMl: 70, abv: 5, quantity: 1 }, // 0.35
    ];
    expect(determineStatus({ mode: 'limit', drinks, dailyLimitUnits: 2 })).toBe('win');
  });
});

describe('determineStatus — manual mode', () => {
  it('returns the user-declared status regardless of drinks', () => {
    expect(determineStatus({ mode: 'manual', drinks: [beer, beer], manualStatus: 'win' })).toBe('win');
    expect(determineStatus({ mode: 'manual', drinks: [], manualStatus: 'slip' })).toBe('slip');
  });
  it('defaults to win when nothing is declared', () => {
    expect(determineStatus({ mode: 'manual', drinks: [] })).toBe('win');
  });
});

describe('evaluateStatus', () => {
  it('reports overBy + withinLimit in limit mode', () => {
    const ev = evaluateStatus({ mode: 'limit', drinks: [beer, beer], dailyLimitUnits: 2 });
    expect(ev.status).toBe('slip');
    expect(ev.withinLimit).toBe(false);
    expect(ev.overBy).toBeCloseTo(1.3, 10);
    expect(ev.limit).toBe(2);
    expect(ev.isAutomatic).toBe(true);
  });
  it('reports zero-mode automatic flag and within state', () => {
    const ev = evaluateStatus({ mode: 'zero', drinks: [] });
    expect(ev.isAutomatic).toBe(true);
    expect(ev.withinLimit).toBe(true);
    expect(ev.limit).toBeNull();
  });
  it('marks manual mode as non-automatic', () => {
    const ev = evaluateStatus({ mode: 'manual', drinks: [beer], manualStatus: 'win' });
    expect(ev.isAutomatic).toBe(false);
    expect(ev.totalUnits).toBeCloseTo(1.65, 10);
  });
});
