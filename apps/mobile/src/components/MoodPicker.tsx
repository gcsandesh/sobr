import { Text, View } from 'react-native';
import { MOODS } from '@sobr/config';
import { PressableStyled } from './ui';
import { colors } from '../theme';

/**
 * "How did today feel?": five equal tiles, rough to great. Tapping the chosen
 * mood again clears it; it's always optional. Static styles only (see
 * PressableStyled): function styles are dropped on Android.
 */
export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (mood: number | null) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
      {MOODS.map((m) => {
        const on = value === m.value;
        return (
          <PressableStyled
            key={m.value}
            onPress={() => onChange(on ? null : m.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${m.label}${on ? ', selected. Tap again to clear' : ''}`}
            style={{
              flex: 1,
              minHeight: 68,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              backgroundColor: on ? colors.accentBg : colors.card,
              borderWidth: 1.5,
              borderColor: on ? colors.accent : 'transparent',
              shadowColor: '#1B3A35',
              shadowOpacity: on ? 0 : 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: on ? 0 : 1,
            }}
            pressedStyle={{ opacity: 0.75 }}
          >
            <Text style={{ fontSize: 24, opacity: value && !on ? 0.45 : 1 }}>{m.emoji}</Text>
            <Text
              style={{
                fontFamily: on ? 'Figtree_700Bold' : 'Figtree_500Medium',
                fontSize: 12,
                color: on ? colors.accent : colors.textFaint,
              }}
            >
              {m.label}
            </Text>
          </PressableStyled>
        );
      })}
    </View>
  );
}
