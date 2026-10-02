import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyNotificationSchedule,
  hasNotificationPermission,
  type NotificationPrefs,
} from '../lib/notifications';

const STORAGE_KEY = 'sobr.notifications.v2';

const DEFAULTS: NotificationPrefs = {
  checkinEnabled: false,
  checkinHour: 21, // 9 PM — a natural end-of-day reflection time
  motivationEnabled: false,
  motivationHour: 9, // 9 AM — start the day on a warm note
};

/**
 * Device-local notification preferences (no server sync — per-device setting).
 * Persists both schedules (daily check-in + daily motivation) and applies them
 * atomically via the notifications module.
 */
export function useNotificationPrefs() {
  const [loaded, setLoaded] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) });
      } catch {
        // ignore — fall back to defaults
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const apply = useCallback(
    async (patch: Partial<NotificationPrefs>): Promise<boolean> => {
      setBusy(true);
      try {
        const next = { ...prefs, ...patch };
        const ok = await applyNotificationSchedule(next);
        if (!ok && (next.checkinEnabled || next.motivationEnabled)) {
          // permission denied / unsupported — turn everything back off
          const off = { ...next, checkinEnabled: false, motivationEnabled: false };
          setPrefs(off);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(off));
          return false;
        }
        setPrefs(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
      } finally {
        setBusy(false);
      }
    },
    [prefs],
  );

  return {
    loaded,
    busy,
    ...prefs,
    toggleCheckin: (v: boolean) => apply({ checkinEnabled: v }),
    setCheckinHour: (h: number) => apply({ checkinHour: h }),
    toggleMotivation: (v: boolean) => apply({ motivationEnabled: v }),
    setMotivationHour: (h: number) => apply({ motivationHour: h }),
  };
}

/**
 * Re-apply the stored schedule once per launch. Keeps scheduled reminders in
 * step with the current app version (copy, tap-to-open data) after an update,
 * and restores them if the OS dropped them. Silent: skips unless permission
 * was already granted, so it never pops a prompt on startup.
 */
export async function resyncNotificationSchedule(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const prefs = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
    if (!prefs.checkinEnabled && !prefs.motivationEnabled) return;
    if (!(await hasNotificationPermission())) return;
    await applyNotificationSchedule(prefs);
  } catch {
    // best effort; the Settings toggles still re-apply on change
  }
}
