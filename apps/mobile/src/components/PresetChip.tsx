import { Pressable, Text, View } from 'react-native';
import { presetChipLabel, presetDetail, type DrinkPreset } from '@sobr/config';
import { colors } from '../theme';

/**
 * One quick-add option: a compact rounded rectangle with the drink's name and,
 * underneath, its size and strength ("330ml · 5%"), so picking the right one
 * doesn't need a custom entry. Used by Home's quick-add sheet and the day screen.
 */
export function PresetChip({
  preset,
  onPress,
  disabled = false,
}: {
  preset: DrinkPreset;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Add ${preset.name}, ${presetDetail(preset)}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        paddingVertical: 6,
        paddingLeft: 8,
        paddingRight: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: pressed ? colors.accent : colors.border,
        backgroundColor: pressed ? colors.accentBg : colors.card,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {preset.glyph ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.cardRaised,
          }}
        >
          <Text style={{ fontSize: 16 }}>{preset.glyph}</Text>
        </View>
      ) : null}
      <View>
        <Text
          style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 13.5, lineHeight: 17, color: colors.text }}
          numberOfLines={1}
        >
          {presetChipLabel(preset.name)}
        </Text>
        <Text
          style={{ fontFamily: 'Figtree_500Medium', fontSize: 11.5, lineHeight: 15, color: colors.textFaint }}
        >
          {presetDetail(preset)}
        </Text>
      </View>
    </Pressable>
  );
}
