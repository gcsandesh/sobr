import type { DailyEntryWithDrinks } from './schemas';
import { roundUnits, totalCost, totalUnits } from './units';

/**
 * A user's history as CSV: one row per day, oldest first, so it opens cleanly
 * in any spreadsheet. Pure (no I/O), so the app decides where the text goes.
 *
 * Columns: date, status, units, spent, items, note. `items` is a readable
 * summary ("2× Beer · regular; Raksi"), not a nested structure.
 */
export const CSV_HEADER = ['date', 'status', 'units', 'spent', 'items', 'note'] as const;

/** RFC 4180 quoting, plus a guard against spreadsheet formula injection. */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // A cell starting with = + - @ runs as a formula in Excel/Sheets; a leading
  // apostrophe makes it plain text. Numbers are never user-typed, so skip them.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function entriesToCsv(entries: ReadonlyArray<DailyEntryWithDrinks>): string {
  const rows = [...entries]
    .sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0))
    .map((e) => {
      const spent = totalCost(e.drinks);
      const items = e.drinks
        .map((d) => (d.quantity > 1 ? `${d.quantity}× ${d.name}` : d.name))
        .join('; ');
      return [
        e.entryDate,
        e.status,
        roundUnits(totalUnits(e.drinks)),
        spent > 0 ? Math.round(spent * 100) / 100 : '',
        items,
        e.note ?? '',
      ]
        .map(csvCell)
        .join(',');
    });
  return [CSV_HEADER.join(','), ...rows].join('\r\n') + '\r\n';
}
