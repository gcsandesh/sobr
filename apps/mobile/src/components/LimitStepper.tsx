import { Pressable, View } from 'react-native';
import { Txt } from './ui';
import { colors } from '../theme';

const LIMIT_STEP = 0.5;
const LIMIT_MIN = 0.5;
const LIMIT_MAX = 20;

/**
 * Daily limit as a stepper (0.5-unit steps) instead of a text field: no
 * keyboard inside a sheet, no unparsable input, and each tap saves.
 */
export function LimitStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, v)));
  const btn = 'w-12 h-12 rounded-full items-center justify-center bg-surface-raised active:opacity-70';
  return (
    <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <Txt variant="label">Daily limit</Txt>
      <View className="flex-row items-center justify-between mt-2">
        <Pressable
          onPress={() => set(value - LIMIT_STEP)}
          disabled={value <= LIMIT_MIN}
          accessibilityRole="button"
          accessibilityLabel="Lower the limit by half a unit"
          className={`${btn} ${value <= LIMIT_MIN ? 'opacity-40' : ''}`}
        >
          <Txt variant="title">−</Txt>
        </Pressable>
        <View className="items-center" accessibilityLiveRegion="polite">
          <Txt variant="displaySm" style={{ color: colors.accent }}>
            {value}
          </Txt>
          <Txt variant="caption">units a day</Txt>
        </View>
        <Pressable
          onPress={() => set(value + LIMIT_STEP)}
          disabled={value >= LIMIT_MAX}
          accessibilityRole="button"
          accessibilityLabel="Raise the limit by half a unit"
          className={`${btn} ${value >= LIMIT_MAX ? 'opacity-40' : ''}`}
        >
          <Txt variant="title">+</Txt>
        </Pressable>
      </View>
      <Txt variant="caption" className="mt-3">
        Half-unit steps. The day screen shows units as you log, so you can tune this anytime.
      </Txt>
    </View>
  );
}
