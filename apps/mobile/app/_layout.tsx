import '../global.css';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Fraunces_700Bold, Fraunces_900Black } from '@expo-google-fonts/fraunces';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { asyncStoragePersister, queryClient } from '../src/lib/queryClient';
import { completeSessionFromUrl } from '../src/lib/auth';
import { isSupabaseConfigured } from '../src/lib/env';
import { SessionProvider, useSession } from '../src/data/SessionProvider';
import { useSettings } from '../src/data/hooks';
import { colors } from '../src/theme';

function Splash() {
  return <View className="flex-1 bg-bg" />;
}

/**
 * Dev-only bypass: set EXPO_PUBLIC_SKIP_AUTH=1 in your local .env to jump straight
 * to the tabs, skipping sign-in/onboarding entirely — handy for testing UI in
 * Expo Go where Google sign-in can't run and email-OTP requires a real inbox.
 * Gated on `__DEV__` too, so it's structurally impossible for this to activate in
 * a production build even if the env var leaks into one. With no session, data
 * queries stay disabled (by design — see useUid), so screens render their normal
 * empty/first-run states rather than throwing.
 *
 * Caveat: read-only screens degrade gracefully, *writes* cannot. Onboarding's
 * last step is a write, so `(onboarding)` is a dead end under the bypass — it
 * surfaces "You need to be signed in to do that" and goes no further. It stays
 * reachable on purpose (for UI work), and `app/index.tsx` keeps cold start from
 * landing there by accident. To exercise onboarding for real, set this to 0.
 */
const DEV_SKIP_AUTH = __DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === '1';

/**
 * Routing gate. Sends the user to the right place based on configuration, auth,
 * and onboarding state. Calm by design — no flashes between states.
 */
function Gate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initializing } = useSession();
  const settings = useSettings();

  useEffect(() => {
    if (DEV_SKIP_AUTH) {
      // Only bounce out of the auth/setup flows — detail routes like day/[date],
      // steady, about, and the onboarding steps must stay reachable while
      // testing (onboarding is never *forced* here, just not blocked).
      const g = segments[0];
      if (g === '(auth)' || g === 'setup' || !g) router.replace('/(tabs)');
      return;
    }
    if (!isSupabaseConfigured) {
      if (segments[0] !== 'setup') router.replace('/setup');
      return;
    }
    if (initializing) return;

    const group = segments[0];
    const signedIn = !!session;

    if (!signedIn) {
      if (group !== '(auth)') router.replace('/(auth)/sign-in');
      return;
    }
    // signed in — wait for settings to resolve before deciding onboarding
    if (settings.isLoading) return;
    const onboarded = settings.data?.onboarded ?? false;

    if (!onboarded) {
      if (group !== '(onboarding)') router.replace('/(onboarding)');
    } else if (group === '(auth)' || group === '(onboarding)' || group === 'setup' || !group) {
      router.replace('/(tabs)');
    }
  }, [router, segments, session, initializing, settings.isLoading, settings.data?.onboarded]);

  if (initializing && isSupabaseConfigured) return <Splash />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="setup" />
      {/*
        `headerBackButtonDisplayMode: 'minimal'` shows just the chevron — without
        it the back button inherits the parent route's name and renders the raw
        group label "(tabs)".
      */}
      <Stack.Screen
        name="day/[date]"
        options={{
          headerShown: true,
          presentation: 'card',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          headerShown: true,
          presentation: 'card',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen name="steady" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_900Black,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // Native OAuth deep link: if the "sobr://auth-callback" redirect opens the app
  // (cold start or background), turn the URL into a session. Web finishes via
  // detectSessionInUrl, so this is native-only.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handle = (url: string | null) => {
      if (url && url.includes('auth-callback')) {
        void completeSessionFromUrl(url).catch(() => {});
      }
    };
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    void Linking.getInitialURL().then(handle);
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
          onSuccess={() => {
            // resend any writes that were queued while offline
            void queryClient.resumePausedMutations();
          }}
        >
          <SessionProvider>
            <StatusBar style="dark" />
            <Gate />
          </SessionProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
