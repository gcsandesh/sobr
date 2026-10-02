import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { WinMode } from '@sobr/core';
import { LimitStepper } from '../../src/components/LimitStepper';
import { OnboardingProgress } from '../../src/components/OnboardingProgress';
import { Button, Card, Screen, Txt } from '../../src/components/ui';
import { deviceTimeZone, useUpdateSettings } from '../../src/data/hooks';
import { errorMessage } from '../../src/lib/errorMessage';
import { colors } from '../../src/theme';

/**
 * Step 3 of 3 — choosing what a "win" means. Language stays focused on growth
 * + clear days. Finishing persists the choice and flips `onboarded`.
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

export default function WinCondition() {
  const router = useRouter();
  const [mode, setMode] = useState<WinMode>('zero');
  const [limit, setLimit] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateSettings();

  async function finish() {
    setError(null);
    try {
      await update.mutateAsync({
        winMode: mode,
        dailyLimitUnits: mode === 'limit' ? limit : undefined,
        timeZone: deviceTimeZone(),
        onboarded: true,
      });
      // Gate routes to the tabs once settings refetch shows onboarded = true.
    } catch (e) {
      // Without this the button just does nothing on failure — the whole
      // onboarding flow looked like a dead end.
      setError(`Couldn’t save that — ${errorMessage(e, 'check your connection and try again.')}`);
    }
  }

  return (
    <Screen scroll>
      <OnboardingProgress step={2} total={3} />
      <Txt variant="title" className="mb-1">
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
              style={{ outlineColor: colors.accent, outlineOffset: 2 }}
            >
              {/*
                Selected state is set via `style`, not classes: the Card's own
                bg/border utilities and the `heading` variant's `text-text` win
                the class merge, which left selection nearly invisible.
              */}
              <Card
                style={
                  selected
                    ? {
                        borderColor: colors.accent,
                        borderWidth: 2,
                        backgroundColor: colors.accentBg,
                      }
                    : undefined
                }
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Txt variant="heading" style={selected ? { color: colors.accent } : undefined}>
                      {m.title}
                    </Txt>
                    <Txt variant="bodyMuted" className="mt-1">
                      {m.blurb}
                    </Txt>
                  </View>
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                    style={{
                      borderWidth: 2,
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.accent : 'transparent',
                    }}
                  >
                    {selected && (
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colors.card }}
                      />
                    )}
                  </View>
                </View>
                {m.key === 'limit' && selected && (
                  <LimitStepper value={limit} onChange={setLimit} />
                )}
              </Card>
            </Pressable>
          );
        })}
      </View>

      {error && (
        <Txt variant="body" className="text-slip text-sm mt-4">
          {error}
        </Txt>
      )}

      <View className="flex-row gap-3 mt-8 mb-4">
        <Button label="Back" tone="ghost" onPress={() => router.back()} className="flex-1" />
        <Button
          label="Plant my tree"
          onPress={finish}
          loading={update.isPending}
          className="flex-[2]"
        />
      </View>
    </Screen>
  );
}
