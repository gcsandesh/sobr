import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Drizzle schema for sobr. Used server-side (migrations, scripts, seed) — the
 * Expo app talks to Supabase via supabase-js + RLS, not a direct DB connection.
 *
 * `user_id` columns reference `auth.users(id)`; that FK + all RLS policies +
 * triggers live in the hand-written SQL migration (migrations/0000_init.sql),
 * since they touch Supabase's `auth` schema which Drizzle does not manage.
 *
 * NOTE: numeric columns surface as strings via Drizzle — convert at the edges.
 * Units are never stored; they are derived in @sobr/core from volume/abv/quantity.
 */

export const userSettings = pgTable(
  'user_settings',
  {
    userId: uuid('user_id').primaryKey(),
    winMode: text('win_mode').notNull().default('zero'),
    dailyLimitUnits: numeric('daily_limit_units').notNull().default('2'),
    currency: text('currency').notNull().default('USD'),
    timeZone: text('time_zone').notNull().default('UTC'),
    onboarded: boolean('onboarded').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('win_mode_valid', sql`${t.winMode} in ('zero','limit','manual')`)],
);

export const dailyEntries = pgTable(
  'daily_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    entryDate: date('entry_date').notNull(),
    status: text('status').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('daily_entries_user_date_unique').on(t.userId, t.entryDate),
    check('status_valid', sql`${t.status} in ('win','slip','freeze')`),
  ],
);

export const drinks = pgTable(
  'drinks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dailyEntryId: uuid('daily_entry_id')
      .notNull()
      .references(() => dailyEntries.id, { onDelete: 'cascade' }),
    presetKey: text('preset_key'),
    name: text('name').notNull(),
    volumeMl: numeric('volume_ml').notNull(),
    abv: numeric('abv').notNull(),
    cost: numeric('cost'),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('quantity_positive', sql`${t.quantity} >= 1`),
    check('volume_positive', sql`${t.volumeMl} > 0`),
    check('abv_range', sql`${t.abv} >= 0 and ${t.abv} <= 100`),
  ],
);

export const freezeGrants = pgTable('freeze_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  grantedForStreak: integer('granted_for_streak').notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  usedOnEntryId: uuid('used_on_entry_id').references(() => dailyEntries.id, {
    onDelete: 'set null',
  }),
});

export type UserSettingsRow = typeof userSettings.$inferSelect;
export type DailyEntryRow = typeof dailyEntries.$inferSelect;
export type DrinkRow = typeof drinks.$inferSelect;
export type FreezeGrantRow = typeof freezeGrants.$inferSelect;
