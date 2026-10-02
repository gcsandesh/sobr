import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { entriesToCsv } from '@sobr/core';
import * as api from '../data/api';

/**
 * Export every logged day as CSV and hand it to the OS share sheet (web:
 * download). Fetches fresh from the server rather than reading the query
 * cache — a backup should reflect what is actually stored, not a stale copy.
 *
 * The UTF-8 BOM is for Excel, which otherwise reads UTF-8 as a legacy codepage
 * and mangles "×", emoji, and any non-Latin note. On native it is written as
 * raw bytes: a leading U+FEFF in a *string* write is silently dropped, which
 * was only caught by reading the file back off the device.
 */
export async function exportEntriesCsv(userId: string, currency?: string): Promise<void> {
  const entries = await api.fetchAllEntries(userId);
  const csv = entriesToCsv(entries, currency);
  const name = `sobr-export-${localDate()}.csv`;

  if (Platform.OS === 'web') {
    // a Blob does keep a string BOM, unlike the native string write below
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing isn’t available on this device.');
  }
  // cache, not documents: the file only needs to live until the share sheet
  // hands it off, and the OS may clear it afterwards
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  const body = new TextEncoder().encode(csv);
  const bytes = new Uint8Array(body.length + 3);
  bytes.set([0xef, 0xbb, 0xbf]);
  bytes.set(body, 3);
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export your sobr data',
  });
}

/** Device-local YYYY-MM-DD for the filename (toISOString would give UTC). */
function localDate(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
