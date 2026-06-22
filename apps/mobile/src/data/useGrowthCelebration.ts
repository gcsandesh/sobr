import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { growthMetaForKey, type GrowthStageMeta } from '@sobr/config';
import type { GrowthStageKey } from '@sobr/core';

const KEY = 'sobr.lastCelebratedStageIndex';

/**
 * Detects when the growth stage has increased since the last time we saw it
 * (persisted across launches) and returns the new stage's meta so the home
 * screen can celebrate once. First run just records a baseline — no celebration
 * for simply opening the app at the seed stage.
 */
export function useGrowthCelebration(
  stageIndex: number,
  stage: GrowthStageKey,
  ready: boolean,
) {
  const [celebration, setCelebration] = useState<GrowthStageMeta | null>(null);

  useEffect(() => {
    if (!ready) return; // wait for real data — don't baseline off the loading flash
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const last = raw === null ? null : Number(raw);
        if (last === null) {
          await AsyncStorage.setItem(KEY, String(stageIndex)); // baseline
          return;
        }
        if (stageIndex > last) {
          await AsyncStorage.setItem(KEY, String(stageIndex));
          if (active) setCelebration(growthMetaForKey(stage));
        } else if (stageIndex < last) {
          // lifetime wins only grow; resync defensively without celebrating
          await AsyncStorage.setItem(KEY, String(stageIndex));
        }
      } catch {
        // storage failure shouldn't break the home screen
      }
    })();
    return () => {
      active = false;
    };
  }, [stageIndex, stage, ready]);

  return { celebration, dismiss: () => setCelebration(null) };
}
