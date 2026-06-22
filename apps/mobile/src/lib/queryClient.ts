import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Offline-tolerant query client.
 *  - onlineManager is wired to NetInfo (web + native) so reads/writes behave
 *    correctly offline and mutations auto-resume on reconnect.
 *  - the cache is persisted to AsyncStorage (see PersistQueryClientProvider), so
 *    reopening the app — even offline — shows the last-known data instantly.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      // keep cached data long enough to be worth persisting (7 days)
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'sobr.rq-cache',
  // don't persist transient/errored state
  throttleTime: 1000,
});
