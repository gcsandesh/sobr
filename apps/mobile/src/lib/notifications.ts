import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Gentle daily reminder — a single repeating LOCAL notification (no servers, no
 * push tokens, nothing leaves the device). Copy stays warm and non-triggering:
 * it invites reflection, never mentions what we'd rather not dwell on.
 *
 * Web has no reliable scheduled local notifications, so everything no-ops there.
 */

// Foreground display behaviour (SDK 54 fields).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const isNative = Platform.OS !== 'web';

export async function ensureReminderPermission(): Promise<boolean> {
  if (!isNative) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
  });
}

/** Schedule (or reschedule) the daily reminder at the given local time. */
export async function scheduleDailyReminder(hour: number, minute = 0): Promise<boolean> {
  if (!isNative) return false;
  const ok = await ensureReminderPermission();
  if (!ok) return false;
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'A moment for sobr',
      body: 'How did today feel? A few quiet seconds to check in.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'daily-reminder',
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isNative) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
