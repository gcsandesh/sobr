import { describe, expect, it } from 'vitest';
import { allTimeStats, monthlyAggregates, totalWinDays } from '../aggregates.js';
import { mkDrink, mkEntry } from './helpers.js';

const beer = () => mkDrink({ volumeMl: 330, abv: 5, cost: 4 }); // 1.65 units, cost 4
const wine = () => mkDrink({ volumeMl: 150, abv: 12, cost: 6, quantity: 2 }); // 3.6 units, cost 12

describe('monthlyAggregates', () => {
  const entries = [
    mkEntry('2026-06-02', 'win'),
    mkEntry('2026-06-10', 'slip', [beer(), wine()]), // 5.25 units, 16 cost
    mkEntry('2026-06-15', 'freeze', [beer()]), // 1.65 units, 4 cost
    mkEntry('2026-05-20', 'slip', [beer()]), // different month, excluded
  ];

  it('includes only the anchor month', () => {
    const s = monthlyAggregates(entries, '2026-06-21');
    expect(s.wins).toBe(1);
    expect(s.slips).toBe(1);
    expect(s.freezes).toBe(1);
    expect(s.drinkingDays).toBe(2); // 06-10 and 06-15
    expect(s.totalUnits).toBeCloseTo(6.9, 10); // 5.25 + 1.65
    expect(s.totalSpent).toBe(20); // 16 + 4
    expect(s.avgUnitsPerDrinkingDay).toBeCloseTo(6.9 / 2, 10);
  });

  it('avg units per drinking day is 0 when there were no drinking days', () => {
    const s = monthlyAggregates([mkEntry('2026-06-01', 'win')], '2026-06-21');
    expect(s.drinkingDays).toBe(0);
    expect(s.avgUnitsPerDrinkingDay).toBe(0);
  });
});

describe('totalWinDays', () => {
  it('counts only wins, not freezes or slips', () => {
    const entries = [
      mkEntry('2026-06-01', 'win'),
      mkEntry('2026-06-02', 'win'),
      mkEntry('2026-06-03', 'freeze'),
      mkEntry('2026-06-04', 'slip'),
    ];
    expect(totalWinDays(entries)).toBe(2);
  });
});

describe('allTimeStats', () => {
  it('rolls up everything and carries the longest streak through', () => {
    const entries = [
      mkEntry('2026-06-01', 'win'),
      mkEntry('2026-06-02', 'slip', [beer()]),
      mkEntry('2026-06-03', 'win'),
    ];
    const s = allTimeStats(entries, 12);
    expect(s.longestStreak).toBe(12);
    expect(s.totalWinDays).toBe(2);
    expect(s.totalUnits).toBeCloseTo(1.65, 10);
    expect(s.totalSpent).toBe(4);
  });
});
