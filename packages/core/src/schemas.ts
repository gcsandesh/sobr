import { z } from 'zod';

/**
 * Shared Zod schemas — the single source of truth for the shapes that cross
 * app <-> server boundaries. Domain objects use camelCase; the DB layer maps to
 * snake_case columns. Units are NEVER part of these shapes — they are derived.
 */

// ---------- Enums ----------

export const winModeSchema = z.enum(['zero', 'limit', 'manual']);
export type WinMode = z.infer<typeof winModeSchema>;

export const entryStatusSchema = z.enum(['win', 'slip', 'freeze']);
export type EntryStatus = z.infer<typeof entryStatusSchema>;

/** A local civil date, 'YYYY-MM-DD'. Always the user's LOCAL day, never UTC. */
export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD local date');
export type LocalDate = z.infer<typeof localDateSchema>;

// ---------- Drink ----------

/** ABV is a percentage number: 5 means 5%. Volume is millilitres. */
export const drinkSchema = z.object({
  id: z.string().uuid(),
  dailyEntryId: z.string().uuid(),
  presetKey: z.string().nullable(),
  name: z.string().min(1, 'Give this drink a name').max(80),
  volumeMl: z.number().positive('Volume must be greater than 0').max(10_000),
  abv: z.number().min(0).max(100),
  cost: z.number().min(0).nullable(),
  quantity: z.number().int().min(1).max(99),
  createdAt: z.string().datetime().optional(),
});
export type Drink = z.infer<typeof drinkSchema>;

/** What a form produces before the row exists (no id / entry id / timestamps). */
export const drinkInputSchema = drinkSchema.pick({
  presetKey: true,
  name: true,
  volumeMl: true,
  abv: true,
  cost: true,
  quantity: true,
});
export type DrinkInput = z.infer<typeof drinkInputSchema>;

// ---------- Daily entry ----------

export const dailyEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  entryDate: localDateSchema,
  status: entryStatusSchema,
  note: z.string().max(500).nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type DailyEntry = z.infer<typeof dailyEntrySchema>;

/** An entry plus its drinks — the unit the logger and calendar work with. */
export const dailyEntryWithDrinksSchema = dailyEntrySchema.extend({
  drinks: z.array(drinkSchema),
});
export type DailyEntryWithDrinks = z.infer<typeof dailyEntryWithDrinksSchema>;

// ---------- User settings ----------

/**
 * A time zone the runtime can actually resolve.
 *
 * This is the client-side half of a two-layer guard: `time_zone` is
 * user-writable under RLS, and the hourly email job evaluates
 * `now() at time zone <value>` for every user. An unparseable value used to
 * abort that whole batch, costing *every* user their mail — see
 * migrations/0005_time_zone_guard.sql, which enforces the same rule in the
 * database. This check is for a kind error message, not for security: a
 * client can always PATCH the column directly.
 */
function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const userSettingsSchema = z.object({
  userId: z.string().uuid(),
  winMode: winModeSchema.default('zero'),
  dailyLimitUnits: z.number().min(0).max(100).default(2),
  currency: z.string().min(2).max(5).default('USD'),
  timeZone: z.string().min(1).refine(isValidTimeZone, {
    message: 'Use an IANA time zone name, e.g. Asia/Kathmandu.',
  }).default('UTC'),
  /** False until first-run onboarding (pick win condition) is completed. */
  onboarded: z.boolean().default(false),
  /**
   * Email delivery, sent server-side by the hourly pg_cron worker (see
   * packages/db/migrations/0002_email.sql) — distinct from the device-local
   * push notifications, which are stored on the device, not here.
   */
  emailReminders: z.boolean().default(true),
  emailWeekly: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

/** Settings fields the user can edit. */
export const userSettingsUpdateSchema = userSettingsSchema
  .pick({
    winMode: true,
    dailyLimitUnits: true,
    currency: true,
    timeZone: true,
    onboarded: true,
    emailReminders: true,
    emailWeekly: true,
  })
  .partial();
export type UserSettingsUpdate = z.infer<typeof userSettingsUpdateSchema>;

// ---------- Freeze grant ----------

export const freezeGrantSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  grantedAt: z.string().datetime(),
  grantedForStreak: z.number().int().positive(),
  usedAt: z.string().datetime().nullable(),
  usedOnEntryId: z.string().uuid().nullable(),
});
export type FreezeGrant = z.infer<typeof freezeGrantSchema>;
