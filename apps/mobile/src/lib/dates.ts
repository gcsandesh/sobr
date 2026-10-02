import type { LocalDate } from '@sobr/core';

/**
 * Display formatting for civil `YYYY-MM-DD` dates. Always formatted at UTC
 * midnight with `timeZone: 'UTC'`, so the device's own zone can never shift a
 * stored day by one on the way to the screen.
 */
function toUtc(date: LocalDate): Date | null {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDay(
  date: LocalDate,
  style: 'short' | 'long' = 'short',
): string {
  const dt = toUtc(date);
  if (!dt) return date;
  return dt.toLocaleDateString(undefined, {
    weekday: style === 'long' ? 'long' : 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** "September 2026" — the section label for a month of days. */
export function formatMonth(date: LocalDate): string {
  const dt = toUtc(date);
  if (!dt) return date;
  return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
