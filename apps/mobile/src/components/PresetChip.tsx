import { Pressable, Text, View } from 'react-native';
import { presetChipLabel, presetDetail, type DrinkPreset } from '@sobr/config';
import { colors } from '../theme';

/**
 * One quick-add option: a rounded tile with the drink's name and, underneath,
 * its size and strength ("330ml · 5%"), so picking the right one doesn't need
 * a custom entry. Tiles are a fixed half width, so a `flex-row flex-wrap gap-2`
 * parent lays them out as a tidy two-column grid instead of a ragged cloud.
 * Used by Home's quick-add sheet and the day screen.
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
        gap: 10,
        width: '48.5%',
        minHeight: 52,
        paddingVertical: 8,
        paddingLeft: 8,
        paddingRight: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: pressed ? colors.accent : 'transparent',
        backgroundColor: pressed ? colors.accentBg : colors.card,
        shadowColor: '#1B3A35',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {preset.glyph ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.cardRaised,
          }}
        >
          <Text style={{ fontSize: 16 }}>{preset.glyph}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 13.5, lineHeight: 17, color: colors.text }}
          numberOfLines={2}
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
