import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { queryClient } from '../src/lib/queryClient';
import { isSupabaseConfigured } from '../src/lib/env';
import { SessionProvider, useSession } from '../src/data/SessionProvider';
import { useSettings } from '../src/data/hooks';
import { colors } from '../src/theme';

function Splash() {
  return <View className="flex-1 bg-bg" />;
}

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
      <Stack.Screen name="day/[date]" options={{ headerShown: true, presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <StatusBar style="light" />
            <Gate />
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
