import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Local notifications — two independent, opt-in schedules (no servers, no push
 * tokens, nothing leaves the device):
 *
 * 1. **Daily check-in** — one quiet nudge a day to reflect and log.
 * 2. **Daily motivation** — a warm, rotating encouragement, one per day. Variety
 *    comes from seven weekly triggers (one per weekday), each with different copy,
 *    so the same message never repeats two days in a row.
 *
 * Copy stays warm and non-triggering: it celebrates growth and invites
 * reflection — it never mentions what we'd rather not dwell on.
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

/** One message per weekday (index 0 = Sunday), rotating weekly. */
const MOTIVATION_MESSAGES: { title: string; body: string }[] = [
  { title: 'Your tree is quietly growing', body: 'Every clear day adds a ring. Keep tending it.' },
  { title: 'One day at a time', body: 'Small steady steps — that’s how groves grow.' },
  { title: 'You’re building something', body: 'Look how far your streak has come already.' },
  { title: 'Proud of you', body: 'Showing up daily is the real win. Keep going.' },
  { title: 'Steady roots', body: 'Clear days compound. Your future self says thank you.' },
  { title: 'It all counts', body: 'However this week went, every day you showed up matters.' },
  { title: 'Keep growing', body: 'Your streak likes company — see how your tree is doing.' },
];

export type NotificationPrefs = {
  checkinEnabled: boolean;
  checkinHour: number;
  motivationEnabled: boolean;
  motivationHour: number;
};

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: 'Daily check-in',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
  });
  await Notifications.setNotificationChannelAsync('motivation', {
    name: 'Daily motivation',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
  });
}

/**
 * Apply the full schedule in one pass: cancel everything, then re-schedule
 * whatever is enabled. Returns false when permission is missing (and anything
 * enabled was requested), so callers can flip their toggles back off.
 */
export async function applyNotificationSchedule(prefs: NotificationPrefs): Promise<boolean> {
  if (!isNative) return false;
  const wantsAny = prefs.checkinEnabled || prefs.motivationEnabled;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!wantsAny) return true;

  const ok = await ensureNotificationPermission();
  if (!ok) return false;
  await ensureAndroidChannels();

  if (prefs.checkinEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A moment for sobr',
        body: 'How did today feel? A few quiet seconds to check in.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.checkinHour,
        minute: 0,
        channelId: 'daily-reminder',
      },
    });
  }

  if (prefs.motivationEnabled) {
    // Seven weekly triggers — a different message each weekday. Expo weekday: 1 = Sunday.
    await Promise.all(
      MOTIVATION_MESSAGES.map((content, i) =>
        Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: i + 1,
            hour: prefs.motivationHour,
            minute: 0,
            channelId: 'motivation',
          },
        }),
      ),
    );
  }
  return true;
}
