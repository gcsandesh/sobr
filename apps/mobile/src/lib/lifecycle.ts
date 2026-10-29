import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  buildBackup,
  entriesToRestore,
  parseBackup,
  todayInTz,
} from '@sobr/core';
import * as api from '../data/api';
import { cancelAllNotifications } from './notifications';
import { supabase } from './supabase';

/**
 * Account lifecycle (migration 0007):
 *  - take a break: nothing is deleted; reminders and emails stop; sign out.
 *  - delete: photos removed now, everything else erased 30 days later by the
 *    server's daily purge; signing back in within 30 days offers Restore.
 *  - personal backup: a full JSON file the user keeps, restorable later.
 */

export async function takeBreak(userId: string): Promise<void> {
  await api.updateSettings(userId, { pausedAt: new Date().toISOString() });
  await cancelAllNotifications();
  await supabase.auth.signOut();
}

export async function resumeAccount(userId: string): Promise<void> {
  await api.updateSettings(userId, { pausedAt: null });
}

export async function requestAccountDeletion(userId: string): Promise<void> {
  // Photos first (day photos and the profile photo): storage files can't be
  // removed by the server's SQL purge.
  await api.deleteAllDayPhotos(userId);
  await api.removeAllAvatarFiles(userId);
  await api.removeAvatar(null);
  await api.updateSettings(userId, { deletionRequestedAt: new Date().toISOString() });
  await cancelAllNotifications();
  await supabase.auth.signOut();
}

export async function cancelAccountDeletion(userId: string): Promise<void> {
  await api.updateSettings(userId, { deletionRequestedAt: null, pausedAt: null });
}

/** The date the purge will erase an account whose deletion was requested at `iso`. */
export function erasureDate(iso: string): Date {
  return new Date(new Date(iso).getTime() + 30 * 24 * 60 * 60 * 1000);
}

/** Build the full JSON backup and hand it to the share sheet (web: download). */
export async function exportBackup(userId: string): Promise<void> {
  const [entries, settings] = await Promise.all([
    api.fetchAllEntries(userId),
    api.fetchSettings(userId),
  ]);
  const backup = buildBackup(entries, settings, new Date().toISOString());
  const json = JSON.stringify(backup, null, 1);
  const name = `sobr-backup-${todayInTz(settings?.timeZone ?? 'UTC')}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your sobr backup',
  });
}

export type RestoreResult =
  | { status: 'cancelled' }
  | { status: 'error'; message: string }
  | { status: 'done'; restored: number; skipped: number };

/** Pick a backup file and restore the days that aren't already logged. */
export async function restoreFromBackup(userId: string): Promise<RestoreResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return { status: 'cancelled' };
  const asset = picked.assets[0];
  if (asset.size && asset.size > 10 * 1024 * 1024) {
    return { status: 'error', message: 'That file is too large to be a sobr backup.' };
  }

  let text: string;
  try {
    text =
      Platform.OS === 'web' && asset.file
        ? await asset.file.text()
        : await new File(asset.uri).text();
  } catch {
    return { status: 'error', message: 'Couldn’t read that file.' };
  }

  const parsed = parseBackup(text);
  if (!parsed.ok) return { status: 'error', message: parsed.error };

  const existing = await api.fetchAllEntries(userId);
  const todo = entriesToRestore(parsed.backup, new Set(existing.map((e) => e.entryDate)));
  const restored = todo.length ? await api.restoreBackupEntries(userId, todo) : 0;
  return { status: 'done', restored, skipped: parsed.backup.entries.length - restored };
}
