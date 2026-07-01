import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '../../src/components/Logo';
import { OnboardingProgress } from '../../src/components/OnboardingProgress';
import { Button, Screen, Txt } from '../../src/components/ui';

/** Step 1 of 3 — the calm first beat. */
export default function Welcome() {
  const router = useRouter();
  return (
    <Screen>
      <OnboardingProgress step={0} total={3} />
      <View className="flex-1 justify-center items-center">
        <Logo size={96} />
        <Txt variant="display" className="mt-8">
          sobr
        </Txt>
        <Txt variant="bodyMuted" className="mt-3 text-center">
          Clear days, counted. Grow something good, one day at a time.
        </Txt>
      </View>
      <Button
        label="Begin"
        onPress={() => router.push('/(onboarding)/how-it-works')}
        className="mb-4"
      />
    </Screen>
  );
}
