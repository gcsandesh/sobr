import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalDate } from '@sobr/core';

const keyFor = (date: LocalDate) => `sobr.pledge.${date}`;

/**
 * A once-a-day pledge, stored locally per date. Deliberately device-local and
 * lightweight — it's a personal ritual, not tracked data, so a missed pledge
 * leaves no trace and nothing to feel bad about.
 */
export function useDailyPledge(today: LocalDate) {
  const [pledged, setPledged] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(keyFor(today))
      .then((v) => {
        if (active) setPledged(v === '1');
      })
      .catch(() => {
        if (active) setPledged(false);
      });
    return () => {
      active = false;
    };
  }, [today]);

  const takePledge = useCallback(() => {
    setPledged(true);
    AsyncStorage.setItem(keyFor(today), '1').catch(() => {});
  }, [today]);

  return { pledged, takePledge };
}
