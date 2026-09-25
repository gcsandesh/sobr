import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '../../src/components/Logo';
import { OnboardingProgress } from '../../src/components/OnboardingProgress';
import { Button, Screen, TextField, Txt } from '../../src/components/ui';
import { useSession } from '../../src/data/SessionProvider';
import { updateDisplayName } from '../../src/lib/account';

/**
 * Step 1 of 3 — the calm first beat, plus an optional name so the app can
 * greet the user personally. Skipping it is fine; it lives in Account later.
 */
export default function Welcome() {
  const router = useRouter();
  const { displayName } = useSession();
  const [name, setName] = useState(displayName ?? '');

  function begin() {
    // Best effort: a name is a nicety, never a reason to block onboarding.
    if (name.trim() && name.trim() !== displayName) void updateDisplayName(name).catch(() => {});
    router.push('/(onboarding)/how-it-works');
  }

  return (
    <Screen scroll>
      <OnboardingProgress step={0} total={3} />
      <View className="flex-1 justify-center items-center py-8">
        <Logo size={96} />
        <Txt variant="display" className="mt-8">
          sobr
        </Txt>
        <Txt variant="bodyMuted" className="mt-3 text-center">
          Clear days, counted. Grow something good, one day at a time.
        </Txt>
      </View>
      <TextField
        label="What should we call you?"
        hint="Optional. Only you will see it."
        value={name}
        onChangeText={setName}
        placeholder="Your first name"
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={40}
        returnKeyType="next"
        onSubmitEditing={begin}
        className="mb-4"
      />
      <Button label="Begin" onPress={begin} className="mb-4" />
    </Screen>
  );
}
