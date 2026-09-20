import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { highestMilestone, type Milestone } from '@sobr/core';

const KEY = 'sobr.lastCelebratedMilestoneDays';

/**
 * Detects when a new milestone (lifetime clear days) has been reached since we
 * last saw one, persisted across launches. First run baselines silently, same
 * pattern as useGrowthCelebration.
 */
export function useMilestoneCelebration(totalWinDays: number, ready: boolean) {
  const [celebration, setCelebration] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    (async () => {
      try {
        const highest = highestMilestone(totalWinDays);
        const raw = await AsyncStorage.getItem(KEY);
        const last = raw === null ? null : Number(raw);
        if (last === null) {
          await AsyncStorage.setItem(KEY, String(highest?.days ?? 0));
          return;
        }
        const days = highest?.days ?? 0;
        if (days > last) {
          await AsyncStorage.setItem(KEY, String(days));
          if (active && highest) setCelebration(highest);
        } else if (days < last) {
          await AsyncStorage.setItem(KEY, String(days));
        }
      } catch {
        // storage failure shouldn't break the home screen
      }
    })();
    return () => {
      active = false;
    };
  }, [totalWinDays, ready]);

  return { celebration, dismiss: () => setCelebration(null) };
}
