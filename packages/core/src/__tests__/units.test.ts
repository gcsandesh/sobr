import { describe, expect, it } from 'vitest';
import { costForDrink, roundUnits, totalCost, totalUnits, unitsForDrink } from '../units';

describe('unitsForDrink', () => {
  it('applies the UK formula: volume_ml * abv / 1000', () => {
    // 330ml @ 5% = 1.65 units
    expect(unitsForDrink({ volumeMl: 330, abv: 5, quantity: 1 })).toBeCloseTo(1.65, 10);
    // 150ml @ 12% = 1.8 units
    expect(unitsForDrink({ volumeMl: 150, abv: 12, quantity: 1 })).toBeCloseTo(1.8, 10);
    // 30ml @ 40% = 1.2 units
    expect(unitsForDrink({ volumeMl: 30, abv: 40, quantity: 1 })).toBeCloseTo(1.2, 10);
  });

  it('multiplies by quantity', () => {
    expect(unitsForDrink({ volumeMl: 330, abv: 5, quantity: 3 })).toBeCloseTo(4.95, 10);
  });

  it('is zero for a 0% ABV drink', () => {
    expect(unitsForDrink({ volumeMl: 500, abv: 0, quantity: 2 })).toBe(0);
  });
});

describe('totalUnits', () => {
  it('sums across drinks', () => {
    const drinks = [
      { volumeMl: 330, abv: 5, quantity: 1 }, // 1.65
      { volumeMl: 150, abv: 12, quantity: 2 }, // 3.6
    ];
    expect(totalUnits(drinks)).toBeCloseTo(5.25, 10);
  });

  it('is zero for no drinks', () => {
    expect(totalUnits([])).toBe(0);
  });
});

describe('cost', () => {
  it('multiplies cost by quantity and treats null as 0', () => {
    expect(costForDrink({ cost: 5, quantity: 3 })).toBe(15);
    expect(costForDrink({ cost: null, quantity: 2 })).toBe(0);
  });

  it('totals cost across mixed drinks', () => {
    expect(totalCost([{ cost: 4, quantity: 2 }, { cost: null, quantity: 1 }, { cost: 3, quantity: 1 }])).toBe(11);
  });
});

describe('roundUnits', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundUnits(1.6499999)).toBe(1.6);
    expect(roundUnits(1.66)).toBe(1.7);
    expect(roundUnits(5.249)).toBe(5.2);
    expect(roundUnits(2.34)).toBe(2.3);
  });
});
