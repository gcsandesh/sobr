import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { WinMode } from '@sobr/core';
import { Logo } from '../../src/components/Logo';
import { Tree } from '../../src/components/Tree';
import { Button, Card, Screen, Txt } from '../../src/components/ui';
import { deviceTimeZone, useUpdateSettings } from '../../src/data/hooks';
import { colors } from '../../src/theme';

/**
 * First-run flow: a couple of calm intro beats, then choosing what a "win" means.
 * Language stays focused on growth + clear days — never on what we'd rather not
 * dwell on. Finishing persists the choice and flips `onboarded`.
 */

const MODES: { key: WinMode; title: string; blurb: string }[] = [
  {
    key: 'zero',
    title: 'A clear day',
    blurb: 'A clear day is a win. Simple and steady.',
  },
  {
    key: 'limit',
    title: 'Within my limit',
    blurb: 'You set a gentle daily limit. Staying under it counts as a win.',
  },
  {
    key: 'manual',
    title: 'I’ll decide each day',
    blurb: 'Reflect, then call it yourself. Some days a win looks different.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<WinMode>('zero');
  const [limit, setLimit] = useState('2');
  const update = useUpdateSettings();

  async function finish() {
    await update.mutateAsync({
      winMode: mode,
      dailyLimitUnits: mode === 'limit' ? Number(limit) || 2 : undefined,
      timeZone: deviceTimeZone(),
      onboarded: true,
    });
    // Gate routes to the tabs once settings refetch shows onboarded = true.
  }

  if (step === 0) {
    return (
      <Screen>
        <View className="flex-1 justify-center items-center">
          <Logo size={96} />
          <Txt variant="display" className="mt-8">
            sobr
          </Txt>
          <Txt variant="bodyMuted" className="mt-3 text-center">
            Clear days, counted. Grow something good, one day at a time.
          </Txt>
        </View>
        <Button label="Begin" onPress={() => setStep(1)} className="mb-4" />
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen>
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
          <Button label="Back" tone="ghost" onPress={() => setStep(0)} className="flex-1" />
          <Button label="Next" onPress={() => setStep(2)} className="flex-1" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Txt variant="title" className="mt-10 mb-1">
        What counts as a win?
      </Txt>
      <Txt variant="bodyMuted" className="mb-6">
        Choose what feels right for you. You can change this anytime.
      </Txt>

      <View className="gap-3">
        {MODES.map((m) => {
          const selected = mode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Card className={selected ? 'border-accent' : ''}>
                <Txt variant="heading" className={selected ? 'text-accent' : ''}>
                  {m.title}
                </Txt>
                <Txt variant="bodyMuted" className="mt-1">
                  {m.blurb}
                </Txt>
                {m.key === 'limit' && selected && (
                  <View className="flex-row items-center gap-3 mt-4">
                    <Txt variant="label">Daily limit (units)</Txt>
                    <TextInput
                      value={limit}
                      onChangeText={setLimit}
                      keyboardType="decimal-pad"
                      maxLength={4}
                      className="bg-bg border border-border rounded-lg px-3 py-2 text-text font-sans w-20 text-center"
                      placeholderTextColor={colors.textFaint}
                    />
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Plant my tree"
        onPress={finish}
        loading={update.isPending}
        className="mt-8 mb-4"
      />
    </Screen>
  );
}
