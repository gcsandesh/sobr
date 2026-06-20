import type { DailyEntryWithDrinks, Drink, EntryStatus, LocalDate } from '../schemas.js';

let counter = 0;
const uuid = () => {
  counter += 1;
  return `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`;
};

export function mkDrink(partial: Partial<Drink> = {}): Drink {
  return {
    id: uuid(),
    dailyEntryId: uuid(),
    presetKey: null,
    name: 'Test drink',
    volumeMl: 330,
    abv: 5,
    cost: null,
    quantity: 1,
    ...partial,
  };
}

export function mkEntry(
  entryDate: LocalDate,
  status: EntryStatus,
  drinks: Drink[] = [],
): DailyEntryWithDrinks {
  return {
    id: uuid(),
    userId: uuid(),
    entryDate,
    status,
    note: null,
    drinks,
  };
}
