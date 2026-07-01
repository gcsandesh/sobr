import { View } from 'react-native';
import { colors } from '../theme';

/** A row of soft dots marking progress through onboarding's steps. */
export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <View
      className="flex-row gap-2 justify-center mb-6"
      accessibilityLabel={`Step ${step + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === step ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}
