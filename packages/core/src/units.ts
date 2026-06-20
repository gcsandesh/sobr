import type { Drink, DrinkInput } from './schemas.js';

/**
 * UK alcohol-units formula. `abv` is a percentage number (5 = 5%).
 *   units = volume_ml * abv / 1000   (per single drink)
 * Quantity multiplies it. This is the ONE place units are computed — every screen
 * and every win/limit comparison routes through here so values never drift.
 */

type UnitBearing = Pick<Drink | DrinkInput, 'volumeMl' | 'abv' | 'quantity'>;
type CostBearing = Pick<Drink | DrinkInput, 'cost' | 'quantity'>;

export function unitsForDrink(drink: UnitBearing): number {
  const qty = drink.quantity ?? 1;
  return (drink.volumeMl * drink.abv) / 1000 * qty;
}

export function totalUnits(drinks: ReadonlyArray<UnitBearing>): number {
  return drinks.reduce((sum, d) => sum + unitsForDrink(d), 0);
}

/** Per-line cost × quantity. Drinks with no cost contribute 0. */
export function costForDrink(drink: CostBearing): number {
  const qty = drink.quantity ?? 1;
  return (drink.cost ?? 0) * qty;
}

export function totalCost(drinks: ReadonlyArray<CostBearing>): number {
  return drinks.reduce((sum, d) => sum + costForDrink(d), 0);
}

/** Round units for display (1 dp). Comparisons use the raw value, not this. */
export function roundUnits(units: number): number {
  return Math.round(units * 10) / 10;
}
