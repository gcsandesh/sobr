import { z } from 'zod';
import {
  drinkInputSchema,
  entryStatusSchema,
  localDateSchema,
  winModeSchema,
  type DailyEntryWithDrinks,
  type UserSettings,
} from './schemas';

/**
 * A full-fidelity personal backup: every day with its drinks and note, plus the
 * user's rules. Offered when someone deletes their account (so they keep their
 * own data, we don't) and restorable from Settings later. Photos are not
 * included: they're files, and a backup should stay small and shareable.
 *
 * Versioned so a future format can still read old files.
 */
export const BACKUP_FORMAT = 'sobr-backup';
export const BACKUP_VERSION = 1;

const backupEntrySchema = z.object({
  date: localDateSchema,
  status: entryStatusSchema,
  note: z.string().max(500).nullable(),
  drinks: z.array(drinkInputSchema).max(100),
});

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  settings: z
    .object({
      winMode: winModeSchema,
      dailyLimitUnits: z.number().min(0).max(100),
      currency: z.string().min(2).max(5),
      timeZone: z.string().min(1),
    })
    .partial(),
  entries: z.array(backupEntrySchema).max(20_000),
});

export type Backup = z.infer<typeof backupSchema>;
export type BackupEntry = z.infer<typeof backupEntrySchema>;

export function buildBackup(
  entries: ReadonlyArray<DailyEntryWithDrinks>,
  settings: Pick<UserSettings, 'winMode' | 'dailyLimitUnits' | 'currency' | 'timeZone'> | null,
  exportedAt: string,
): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    settings: settings
      ? {
          winMode: settings.winMode,
          dailyLimitUnits: settings.dailyLimitUnits,
          currency: settings.currency,
          timeZone: settings.timeZone,
        }
      : {},
    entries: [...entries]
      .sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0))
      .map((e) => ({
        date: e.entryDate,
        status: e.status,
        note: e.note ?? null,
        drinks: e.drinks.map((d) => ({
          presetKey: d.presetKey,
          name: d.name,
          volumeMl: d.volumeMl,
          abv: d.abv,
          cost: d.cost,
          quantity: d.quantity,
        })),
      })),
  };
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; error: string };

/** Parse + validate a backup file's text. Never throws. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    return { ok: false, error: 'That file isn’t a sobr backup (it isn’t valid JSON).' };
  }
  if (!raw || typeof raw !== 'object' || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, error: 'That file isn’t a sobr backup.' };
  }
  if ((raw as { version?: unknown }).version !== BACKUP_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of sobr. Update the app and try again.' };
  }
  const res = backupSchema.safeParse(raw);
  if (!res.success) {
    return { ok: false, error: 'This backup looks damaged, so nothing was imported.' };
  }
  const dates = new Set<string>();
  for (const e of res.data.entries) {
    if (dates.has(e.date)) return { ok: false, error: 'This backup lists the same day twice, so nothing was imported.' };
    dates.add(e.date);
  }
  return { ok: true, backup: res.data };
}

/**
 * Which backup days to restore: only days not already logged. What's in the
 * account now always wins, so restoring can never overwrite newer entries.
 */
export function entriesToRestore(
  backup: Backup,
  existingDates: ReadonlySet<string>,
): BackupEntry[] {
  return backup.entries.filter((e) => !existingDates.has(e.date));
}
