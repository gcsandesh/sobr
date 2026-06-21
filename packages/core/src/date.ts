import type { LocalDate } from './schemas';

/**
 * Timezone-safe local-day helpers.
 *
 * "Today" is the USER'S local day, not UTC. We represent days as 'YYYY-MM-DD'
 * civil-date strings and do all arithmetic on those strings via UTC-midnight
 * anchoring — this sidesteps the classic midnight/DST off-by-one bugs where a
 * late-night log lands on the wrong calendar day.
 *
 * Pure: callers pass in the instant + tz, so behaviour is fully deterministic
 * and testable (no hidden `Date.now()` inside the logic).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Format an instant as the 'YYYY-MM-DD' civil date in the given IANA time zone. */
export function localDateString(instant: Date | number, timeZone: string): LocalDate {
  const date = typeof instant === 'number' ? new Date(instant) : instant;
  // 'en-CA' yields YYYY-MM-DD; explicit parts keep it locale-independent.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** The user's local "today" for the given tz. */
export function todayInTz(timeZone: string, now: Date | number = new Date()): LocalDate {
  return localDateString(now, timeZone);
}

function assertDate(d: string): asserts d is LocalDate {
  if (!DATE_RE.test(d)) throw new RangeError(`Invalid local date: ${d}`);
}

/** Parse a 'YYYY-MM-DD' to its UTC-midnight epoch ms (internal arithmetic anchor). */
function toUtcMs(date: LocalDate): number {
  assertDate(date);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): LocalDate {
  const d = new Date(ms);
  const y = d.getUTCFullYear().toString().padStart(4, '0');
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_MS = 86_400_000;

/** Add (or subtract, with negative n) whole days to a civil date. */
export function addDays(date: LocalDate, n: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + n * DAY_MS);
}

/** Whole-day difference a - b (positive when a is later than b). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  return Math.round((toUtcMs(a) - toUtcMs(b)) / DAY_MS);
}

/** -1 | 0 | 1 comparator for civil dates. */
export function compareDates(a: LocalDate, b: LocalDate): -1 | 0 | 1 {
  const da = toUtcMs(a);
  const db = toUtcMs(b);
  return da < db ? -1 : da > db ? 1 : 0;
}

export const isBefore = (a: LocalDate, b: LocalDate): boolean => compareDates(a, b) < 0;
export const isAfter = (a: LocalDate, b: LocalDate): boolean => compareDates(a, b) > 0;
export const isSameDay = (a: LocalDate, b: LocalDate): boolean => compareDates(a, b) === 0;

/** Inclusive list of civil dates from start..end (ascending). */
export function enumerateDates(start: LocalDate, end: LocalDate): LocalDate[] {
  if (isAfter(start, end)) return [];
  const out: LocalDate[] = [];
  let cur = start;
  while (!isAfter(cur, end)) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** First day of the month for a civil date, e.g. '2026-06-21' -> '2026-06-01'. */
export function startOfMonth(date: LocalDate): LocalDate {
  assertDate(date);
  return `${date.slice(0, 7)}-01`;
}

/** Last day of the month for a civil date. */
export function endOfMonth(date: LocalDate): LocalDate {
  assertDate(date);
  const [y, m] = date.split('-').map(Number) as [number, number, number];
  // Day 0 of next month = last day of this month (UTC-safe).
  return fromUtcMs(Date.UTC(y, m, 0));
}

/** True when the civil date falls within [start, end] inclusive. */
export function isWithin(date: LocalDate, start: LocalDate, end: LocalDate): boolean {
  return !isBefore(date, start) && !isAfter(date, end);
}
