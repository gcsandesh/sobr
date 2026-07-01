import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingProgress } from '../../src/components/OnboardingProgress';
import { Tree } from '../../src/components/Tree';
import { Button, Screen, Txt } from '../../src/components/ui';

/** Step 2 of 3 — how the streak + tree + freeze work together. */
export default function HowItWorks() {
  const router = useRouter();
  return (
    <Screen>
      <OnboardingProgress step={1} total={3} />
      <View className="flex-1 justify-center items-center">
        <Tree stage="young_tree" progress={0.5} size={200} />
        <Txt variant="title" className="mt-6 text-center">
          Every clear day grows your tree
        </Txt>
        <Txt variant="bodyMuted" className="mt-3 text-center">
          Your streak builds quietly. Earn a freeze along the way — it protects your streak on a
          harder day, so one slip never undoes your progress.
        </Txt>
      </View>
      <View className="flex-row gap-3 mb-4">
        <Button label="Back" tone="ghost" onPress={() => router.back()} className="flex-1" />
        <Button
          label="Next"
          onPress={() => router.push('/(onboarding)/win-condition')}
          className="flex-1"
        />
      </View>
    </Screen>
  );
}
