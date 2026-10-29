import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  DRINK_PRESETS,
  PRESET_GROUPS,
  PRESET_GROUP_LABELS,
  presetChipLabel,
  presetDetail,
  type DrinkPreset,
} from '@sobr/config';
import { PlusIcon } from './icons';
import { colors } from '../theme';

/**
 * Quick-add picker: a row of group tabs (Beer, Wine, Spirits…) over one tidy
 * list of that group's options. Each option is a full-width row with a
 * divider, its size and strength, and a clear + target, so a long menu never
 * turns into a cloud of chips. Used by Home's quick-add sheet and the day screen.
 */
export function PresetPicker({
  onPick,
  disabled = false,
}: {
  onPick: (preset: DrinkPreset) => void;
  disabled?: boolean;
}) {
  const [group, setGroup] = useState<DrinkPreset['group']>(PRESET_GROUPS[0]!);
  const items = DRINK_PRESETS.filter((p) => p.group === group);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        accessibilityRole="tablist"
      >
        {PRESET_GROUPS.map((g) => {
          const on = g === group;
          return (
            <Pressable
              key={g}
              onPress={() => setGroup(g)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{
                minHeight: 38,
                paddingHorizontal: 16,
                borderRadius: 10,
                justifyContent: 'center',
                backgroundColor: on ? colors.accent : colors.card,
                borderWidth: 1,
                borderColor: on ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Figtree_600SemiBold',
                  fontSize: 14,
                  color: on ? '#FFFFFF' : colors.textMuted,
                }}
              >
                {PRESET_GROUP_LABELS[g]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={{
          borderRadius: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {items.map((p, i) => (
          <Pressable
            key={p.key}
            onPress={() => onPick(p)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Add ${p.name}, ${presetDetail(p)}`}
            accessibilityState={{ disabled }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 58,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
              backgroundColor: pressed ? colors.accentBg : 'transparent',
              opacity: disabled ? 0.5 : 1,
            })}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bg,
              }}
            >
              <Text style={{ fontSize: 19 }}>{p.glyph ?? '•'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 15, color: colors.text }}
                numberOfLines={1}
              >
                {presetChipLabel(p.name)}
              </Text>
              <Text
                style={{
                  fontFamily: 'Figtree_500Medium',
                  fontSize: 12.5,
                  marginTop: 1,
                  color: colors.textFaint,
                }}
              >
                {presetDetail(p)}
              </Text>
            </View>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentBg,
              }}
            >
              <PlusIcon color={colors.accent} size={16} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
