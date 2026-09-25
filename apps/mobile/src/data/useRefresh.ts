import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { haptics } from '../lib/haptics';

/**
 * Pull-to-refresh: refetch everything on screen. Useful after logging on
 * another device, or when a flaky connection left stale numbers behind.
 */
export function useRefresh() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.select();
    try {
      await qc.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [qc]);
  return { refreshing, onRefresh };
}
