import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Thin, web-safe haptics wrapper. Calm app → gentle, sparing feedback only at
 * meaningful moments (a win, a freeze). No-ops on web and never throws.
 */

function safe(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
}

export const haptics = {
  /** A clear day / a win — soft success. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Freeze used — a gentle, reassuring tap. */
  soft: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  /** Light selection tick for taps that change state. */
  select: () => safe(() => Haptics.selectionAsync()),
};
