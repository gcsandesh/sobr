import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  DRINK_PRESETS,
  PRESET_GROUPS,
  PRESET_GROUP_LABELS,
  presetChipLabel,
  type DrinkPreset,
} from '@sobr/config';
import { roundUnits, unitsForDrink } from '@sobr/core';
import { PlusIcon } from './icons';
import { PressableStyled } from './ui';
import { colors } from '../theme';

/**
 * Quick-add picker: a segmented control (Beer · Wine · Spirits · Local ·
 * Other, all visible at once) over one divided list of that group's options.
 * Each row shows size, strength and units, and a drink that's already on the
 * day shows its count in place of the +, so a tap gives visible feedback.
 * Used by Home's quick-add sheet and the day screen.
 *
 * Styles are plain objects, never `style={({ pressed }) => …}`: NativeWind's
 * Pressable drops function styles on Android (see PressableStyled).
 */
export function PresetPicker({
  onPick,
  disabled = false,
  counts,
}: {
  onPick: (preset: DrinkPreset) => void;
  disabled?: boolean;
  /** Quantity already logged per preset key, for the count badges. */
  counts?: Record<string, number>;
}) {
  const [group, setGroup] = useState<DrinkPreset['group']>(PRESET_GROUPS[0]!);
  const items = DRINK_PRESETS.filter((p) => p.group === group);

  return (
    <View>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          padding: 4,
          gap: 4,
          borderRadius: 12,
          backgroundColor: colors.cardRaised,
          marginBottom: 12,
        }}
      >
        {PRESET_GROUPS.map((g) => {
          const on = g === group;
          return (
            <PressableStyled
              key={g}
              onPress={() => setGroup(g)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.card : 'transparent',
                shadowColor: '#1B3A35',
                shadowOpacity: on ? 0.1 : 0,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: on ? 2 : 0,
              }}
              pressedStyle={on ? null : { opacity: 0.7 }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: on ? 'Figtree_700Bold' : 'Figtree_600SemiBold',
                  fontSize: 13.5,
                  color: on ? colors.accent : colors.textMuted,
                }}
              >
                {PRESET_GROUP_LABELS[g]}
              </Text>
            </PressableStyled>
          );
        })}
      </View>

      {/* shadow outside, clipping inside: iOS clips a clipping view's own shadow */}
      <View
        style={{
          borderRadius: 16,
          backgroundColor: colors.card,
          shadowColor: '#1B3A35',
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        }}
      >
        <View style={{ borderRadius: 16, overflow: 'hidden' }}>
          {items.map((p, i) => {
            const count = counts?.[p.key] ?? 0;
            const units = roundUnits(
              unitsForDrink({ volumeMl: p.volumeMl, abv: p.abv, quantity: 1 }),
            );
            const ml = p.volumeMl >= 1000 ? `${p.volumeMl / 1000} L` : `${p.volumeMl} ml`;
            return (
              <PressableStyled
                key={p.key}
                onPress={() => onPick(p)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Add ${p.name}, ${ml}, ${p.abv}%, ${units} units${count ? `, ${count} added` : ''}`}
                accessibilityState={{ disabled }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 64,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.bg,
                  opacity: disabled ? 0.5 : 1,
                }}
                pressedStyle={{ backgroundColor: colors.accentBg }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.bg,
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 21 }}>{p.glyph ?? '•'}</Text>
                </View>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: 'Figtree_600SemiBold',
                      fontSize: 15.5,
                      color: colors.text,
                    }}
                  >
                    {presetChipLabel(p.name)}
                  </Text>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Figtree_500Medium',
                        fontSize: 12.5,
                        color: colors.textFaint,
                      }}
                    >
                      {ml} · {p.abv}%
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 5,
                        backgroundColor: colors.bg,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Figtree_600SemiBold',
                          fontSize: 11.5,
                          color: colors.textMuted,
                        }}
                      >
                        {units} {units === 1 ? 'unit' : 'units'}
                      </Text>
                    </View>
                  </View>
                </View>
                {count > 0 ? (
                  <View
                    style={{
                      minWidth: 32,
                      height: 32,
                      paddingHorizontal: 8,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accent,
                    }}
                  >
                    <Text
                      style={{ fontFamily: 'Figtree_700Bold', fontSize: 13.5, color: '#FFFFFF' }}
                    >
                      ×{count}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accentBg,
                    }}
                  >
                    <PlusIcon color={colors.accent} size={17} />
                  </View>
                )}
              </PressableStyled>
            );
          })}
        </View>
      </View>
    </View>
  );
}
