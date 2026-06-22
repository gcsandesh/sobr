import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelDailyReminder, scheduleDailyReminder } from '../lib/notifications';

const K_ENABLED = 'sobr.reminder.enabled';
const K_HOUR = 'sobr.reminder.hour';
const DEFAULT_HOUR = 21; // 9 PM

/**
 * Device-local reminder preference (no server sync — it's a per-device setting).
 * Persists enabled + hour and (re)schedules the single daily local notification.
 */
export function useReminder() {
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [e, h] = await Promise.all([
          AsyncStorage.getItem(K_ENABLED),
          AsyncStorage.getItem(K_HOUR),
        ]);
        setEnabled(e === '1');
        if (h !== null) setHour(Number(h));
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const apply = useCallback(async (nextEnabled: boolean, nextHour: number): Promise<boolean> => {
    setBusy(true);
    try {
      if (nextEnabled) {
        const ok = await scheduleDailyReminder(nextHour);
        if (!ok) {
          // permission denied / unsupported — keep it off
          setEnabled(false);
          await AsyncStorage.setItem(K_ENABLED, '0');
          return false;
        }
      } else {
        await cancelDailyReminder();
      }
      setEnabled(nextEnabled);
      setHour(nextHour);
      await AsyncStorage.multiSet([
        [K_ENABLED, nextEnabled ? '1' : '0'],
        [K_HOUR, String(nextHour)],
      ]);
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    loaded,
    enabled,
    hour,
    busy,
    toggle: (v: boolean) => apply(v, hour),
    setTime: (h: number) => apply(enabled, h),
  };
}
