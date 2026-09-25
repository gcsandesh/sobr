import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { entriesToCsv, type DailyEntryWithDrinks } from '@sobr/core';

/**
 * Hand the user a CSV of every day they've logged. Native writes it to the
 * cache folder and opens the share sheet (save to Files/Drive, email it...);
 * web triggers a normal download. Nothing is uploaded anywhere by us.
 */
export async function exportCsv(entries: DailyEntryWithDrinks[], today: string): Promise<void> {
  // BOM first: without it Excel reads UTF-8 as ANSI, garbling ×, curly
  // quotes, Devanagari and emoji in notes.
  const csv = '\uFEFF' + entriesToCsv(entries);
  const name = `sobr-days-${today}.csv`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing isn’t available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export your days',
    UTI: 'public.comma-separated-values-text',
  });
}
