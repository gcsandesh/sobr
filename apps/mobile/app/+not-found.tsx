import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Logo } from '../src/components/Logo';
import { Button, Screen, Txt } from '../src/components/ui';

/** A wrong turn (stale link, old bookmark): calm, one way home. */
export default function NotFound() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Logo size={64} />
          <Txt variant="title" className="mt-6 text-center">
            This path doesn’t lead anywhere
          </Txt>
          <Txt variant="bodyMuted" className="mt-2 text-center">
            The page may have moved. Your days are right where you left them.
          </Txt>
        </View>
        <Button label="Back to home" onPress={() => router.replace('/')} className="mb-4" />
      </Screen>
    </>
  );
}
