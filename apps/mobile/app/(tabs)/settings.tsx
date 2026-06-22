import { useState } from 'react';
import { Alert, Platform, Pressable, Switch, TextInput, View } from 'react-native';
import type { WinMode } from '@sobr/core';
import { CURRENCIES } from '@sobr/config';
import { Button, Card, Divider, Row, Screen, Txt } from '../../src/components/ui';
import { useSession } from '../../src/data/SessionProvider';
import { useDeleteAccount, useSettings, useUpdateSettings } from '../../src/data/hooks';
import { useReminder } from '../../src/data/useReminder';
import { colors } from '../../src/theme';

const REMINDER_TIMES = [12, 18, 20, 21, 22];
const formatHour = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
};

const MODE_LABELS: Record<WinMode, string> = {
  zero: 'A clear day',
  limit: 'Within my limit',
  manual: 'I’ll decide each day',
};

export default function Settings() {
  const { email, signOut } = useSession();
  const settings = useSettings();
  const update = useUpdateSettings();
  const deleteAccount = useDeleteAccount();
  const reminder = useReminder();

  const s = settings.data;
  const [limit, setLimit] = useState<string>(String(s?.dailyLimitUnits ?? 2));

  function setMode(winMode: WinMode) {
    update.mutate({ winMode });
  }
  function setCurrency(currency: string) {
    update.mutate({ currency });
  }
  function saveLimit() {
    update.mutate({ dailyLimitUnits: Number(limit) || 2 });
  }

  function confirmDelete() {
    Alert.alert(
      'Delete everything?',
      'This permanently removes your account and all your data. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccount.mutate(),
        },
      ],
    );
  }

  return (
    <Screen scroll>
      <Txt variant="title" className="mt-2 mb-5">
        Settings
      </Txt>

      {/* Win condition */}
      <Txt variant="heading" className="mb-3">
        What counts as a win
      </Txt>
      <Card className="gap-2">
        {(Object.keys(MODE_LABELS) as WinMode[]).map((mode) => {
          const selected = s?.winMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setMode(mode)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className="flex-row items-center justify-between py-3 min-h-[44px]"
            >
              <Txt variant="body" className={selected ? 'text-accent' : ''}>
                {MODE_LABELS[mode]}
              </Txt>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accent : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
        {s?.winMode === 'limit' && (
          <>
            <Divider className="my-2" />
            <Row className="justify-between items-center">
              <Txt variant="label">Daily limit (units)</Txt>
              <Row className="gap-2">
                <TextInput
                  value={limit}
                  onChangeText={setLimit}
                  onEndEditing={saveLimit}
                  keyboardType="decimal-pad"
                  maxLength={4}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-text font-sans w-16 text-center"
                  placeholderTextColor={colors.textFaint}
                />
                <Button label="Save" tone="secondary" onPress={saveLimit} />
              </Row>
            </Row>
          </>
        )}
      </Card>

      {/* Currency */}
      <Txt variant="heading" className="mt-6 mb-3">
        Currency
      </Txt>
      <View className="flex-row flex-wrap gap-2">
        {CURRENCIES.map((c) => {
          const selected = s?.currency === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => setCurrency(c.code)}
              accessibilityLabel={`Use ${c.name}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`px-4 min-h-[44px] justify-center rounded-full border ${
                selected ? 'border-accent bg-accent-bg' : 'border-border bg-surface'
              }`}
            >
              <Txt variant="body" className={`text-sm ${selected ? 'text-accent' : ''}`}>
                {c.symbol} {c.code}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {/* Daily reminder (device-local; native only) */}
      {Platform.OS !== 'web' && (
        <>
          <Txt variant="heading" className="mt-6 mb-3">
            Daily reminder
          </Txt>
          <Card>
            <Row className="justify-between">
              <View className="flex-1 pr-3">
                <Txt variant="body">A gentle nudge</Txt>
                <Txt variant="bodyMuted" className="mt-1">
                  One quiet notification a day to check in. Nothing leaves your device.
                </Txt>
              </View>
              <Switch
                value={reminder.enabled}
                disabled={reminder.busy || !reminder.loaded}
                onValueChange={(v) => {
                  void reminder.toggle(v);
                }}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.text}
              />
            </Row>
            {reminder.enabled && (
              <>
                <Divider className="my-4" />
                <Txt variant="label" className="mb-2">
                  Remind me at
                </Txt>
                <View className="flex-row flex-wrap gap-2">
                  {REMINDER_TIMES.map((h) => {
                    const selected = reminder.hour === h;
                    return (
                      <Pressable
                        key={h}
                        onPress={() => reminder.setTime(h)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Remind at ${formatHour(h)}`}
                        className={`px-4 min-h-[44px] justify-center rounded-full border ${
                          selected ? 'border-accent bg-accent-bg' : 'border-border bg-surface'
                        }`}
                      >
                        <Txt variant="body" className={`text-sm ${selected ? 'text-accent' : ''}`}>
                          {formatHour(h)}
                        </Txt>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </Card>
        </>
      )}

      {/* Account */}
      <Txt variant="heading" className="mt-6 mb-3">
        Account
      </Txt>
      <Card className="gap-1">
        <Txt variant="label">Signed in as</Txt>
        <Txt variant="body">{email ?? '—'}</Txt>
        <Txt variant="caption" className="mt-1">
          Time zone · {s?.timeZone ?? 'UTC'}
        </Txt>
      </Card>
      <Button label="Sign out" tone="secondary" className="mt-3" onPress={() => signOut()} />
      <Button
        label="Delete account & data"
        tone="danger"
        className="mt-2"
        loading={deleteAccount.isPending}
        onPress={confirmDelete}
      />

      <Txt variant="caption" className="text-center mt-6 mb-2">
        Your data is private to you. sobr · Clear days, counted.
      </Txt>
    </Screen>
  );
}
