import type { DailyEntryWithDrinks } from './schemas';
import { roundUnits, totalCost, totalUnits } from './units';

/**
 * One CSV row per logged day — a backup that opens straight into a spreadsheet
 * and does not depend on Supabase still existing.
 *
 * RFC 4180: CRLF line endings, and any field holding a comma, quote or newline
 * is quoted with inner quotes doubled. Notes are free text, so this is what
 * keeps a note like `said "no", then left` from shifting every column after it.
 *
 * ponytail: no formula-escaping of leading `=`/`+`/`-`/`@`. The only author of
 * this data is the person exporting it; add escaping if export ever includes
 * anyone else's text.
 */
export function entriesToCsv(
  entries: ReadonlyArray<DailyEntryWithDrinks>,
  currency?: string,
): string {
  const header = [
    'date',
    'status',
    'units',
    'drinks',
    currency ? `cost (${currency})` : 'cost',
    'note',
  ];
  const rows = [...entries]
    .sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0))
    .map((e) =>
      [
        e.entryDate,
        e.status,
        roundUnits(totalUnits(e.drinks)),
        e.drinks.map((d) => `${d.quantity}× ${d.name}`).join('; '),
        // cents, so cost × quantity float drift (0.1 × 3) never reaches the file
        Math.round(totalCost(e.drinks) * 100) / 100,
        e.note ?? '',
      ]
        .map(field)
        .join(','),
    );
  return [header.join(','), ...rows].join('\r\n') + '\r\n';
}

function field(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
