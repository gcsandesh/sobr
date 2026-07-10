import { useState } from 'react';
import { Alert, Platform, Switch, TextInput, View } from 'react-native';
import type { WinMode } from '@sobr/core';
import { CURRENCIES } from '@sobr/config';
import {
  BellIcon,
  GlobeIcon,
  LogOutIcon,
  SparkIcon,
  TargetIcon,
  WalletIcon,
} from '../../src/components/icons';
import {
  Button,
  Card,
  Chip,
  Divider,
  ListRow,
  Row,
  Screen,
  SectionHeader,
  Txt,
} from '../../src/components/ui';
import { useSession } from '../../src/data/SessionProvider';
import { useDeleteAccount, useSettings, useUpdateSettings, deviceTimeZone } from '../../src/data/hooks';
import { useNotificationPrefs } from '../../src/data/useNotificationPrefs';
import { colors } from '../../src/theme';

const REMINDER_TIMES = [12, 18, 20, 21, 22];
const MOTIVATION_TIMES = [8, 9, 12, 17, 19];
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

/** Common IANA zones offered alongside the device zone. */
const COMMON_ZONES = [
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

export default function Settings() {
  const { email, signOut } = useSession();
  const settings = useSettings();
  const update = useUpdateSettings();
  const deleteAccount = useDeleteAccount();
  const notif = useNotificationPrefs();

  const s = settings.data;
  const [limit, setLimit] = useState<string>(String(s?.dailyLimitUnits ?? 2));
  const [showZones, setShowZones] = useState(false);

  const device = deviceTimeZone();
  const zones = [device, ...COMMON_ZONES.filter((z) => z !== device)];

  function saveLimit() {
    update.mutate({ dailyLimitUnits: Number(limit) || 2 });
  }

  function confirmDelete() {
    Alert.alert(
      'Delete everything?',
      'This permanently removes your account and all your data. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount.mutate() },
      ],
    );
  }

  return (
    <Screen scroll>
      <Txt variant="title" className="mt-2 mb-6">
        Settings
      </Txt>

      {/* ── Preferences ─────────────────────────────────────────────── */}
      <SectionHeader title="Preferences" />
      <Card className="mb-6">
        <ListRow
          icon={<TargetIcon color={colors.accent} />}
          title="What counts as a win"
          subtitle={s ? MODE_LABELS[s.winMode] : '—'}
        />
        <View className="flex-row flex-wrap gap-2 mb-2">
          {(Object.keys(MODE_LABELS) as WinMode[]).map((mode) => (
            <Chip
              key={mode}
              label={MODE_LABELS[mode]}
              selected={s?.winMode === mode}
              onPress={() => update.mutate({ winMode: mode })}
            />
          ))}
        </View>
        {s?.winMode === 'limit' && (
          <Row className="justify-between items-center mb-2">
            <Txt variant="label">Daily limit (units)</Txt>
            <Row className="gap-2">
              <TextInput
                value={limit}
                onChangeText={setLimit}
                onEndEditing={saveLimit}
                keyboardType="decimal-pad"
                maxLength={4}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-text font-sans w-16 text-center"
                placeholderTextColor={colors.textFaint}
              />
              <Button label="Save" tone="secondary" onPress={saveLimit} />
            </Row>
          </Row>
        )}

        <Divider className="my-3" />

        <ListRow
          icon={<WalletIcon color={colors.accent} />}
          title="Currency"
          subtitle={s?.currency ?? 'USD'}
        />
        <View className="flex-row flex-wrap gap-2 mb-2">
          {CURRENCIES.map((c) => (
            <Chip
              key={c.code}
              label={`${c.symbol} ${c.code}`}
              selected={s?.currency === c.code}
              onPress={() => update.mutate({ currency: c.code })}
              accessibilityLabel={`Use ${c.name}`}
            />
          ))}
        </View>

        <Divider className="my-3" />

        <ListRow
          icon={<GlobeIcon color={colors.accent} />}
          title="Time zone"
          subtitle={`${s?.timeZone ?? 'UTC'} — decides when your day rolls over`}
          onPress={() => setShowZones((v) => !v)}
          accessibilityLabel="Change time zone"
        />
        {showZones && (
          <View className="flex-row flex-wrap gap-2 mb-2">
            {zones.map((z) => (
              <Chip
                key={z}
                label={z === device ? `${z} (device)` : z}
                selected={s?.timeZone === z}
                onPress={() => update.mutate({ timeZone: z })}
              />
            ))}
          </View>
        )}
      </Card>

      {/* ── Notifications (device-local; native only) ───────────────── */}
      {Platform.OS !== 'web' && (
        <>
          <SectionHeader title="Notifications" caption="stays on this device" />
          <Card className="mb-6">
            <Row className="justify-between">
              <View className="flex-1 pr-3">
                <ListRow
                  icon={<BellIcon color={colors.accent} />}
                  title="Daily check-in"
                  subtitle="One quiet nudge a day to reflect and log."
                />
              </View>
              <Switch
                value={notif.checkinEnabled}
                disabled={notif.busy || !notif.loaded}
                onValueChange={(v) => void notif.toggleCheckin(v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </Row>
            {notif.checkinEnabled && (
              <View className="flex-row flex-wrap gap-2 mb-2">
                {REMINDER_TIMES.map((h) => (
                  <Chip
                    key={h}
                    label={formatHour(h)}
                    selected={notif.checkinHour === h}
                    onPress={() => void notif.setCheckinHour(h)}
                    accessibilityLabel={`Check in at ${formatHour(h)}`}
                  />
                ))}
              </View>
            )}

            <Divider className="my-3" />

            <Row className="justify-between">
              <View className="flex-1 pr-3">
                <ListRow
                  icon={<SparkIcon color={colors.accent} />}
                  title="Daily motivation"
                  subtitle="A warm note each day — a different one every day of the week."
                />
              </View>
              <Switch
                value={notif.motivationEnabled}
                disabled={notif.busy || !notif.loaded}
                onValueChange={(v) => void notif.toggleMotivation(v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </Row>
            {notif.motivationEnabled && (
              <View className="flex-row flex-wrap gap-2 mb-2">
                {MOTIVATION_TIMES.map((h) => (
                  <Chip
                    key={h}
                    label={formatHour(h)}
                    selected={notif.motivationHour === h}
                    onPress={() => void notif.setMotivationHour(h)}
                    accessibilityLabel={`Motivation at ${formatHour(h)}`}
                  />
                ))}
              </View>
            )}
          </Card>
        </>
      )}

      {/* ── Account ─────────────────────────────────────────────────── */}
      <SectionHeader title="Account" />
      <Card className="mb-3">
        <ListRow title="Signed in as" subtitle={email ?? '—'} />
        <Divider className="my-1" />
        <ListRow
          icon={<LogOutIcon color={colors.textMuted} />}
          title="Sign out"
          onPress={() => void signOut()}
        />
      </Card>
      <Button
        label="Delete account & data"
        tone="danger"
        loading={deleteAccount.isPending}
        onPress={confirmDelete}
      />

      <Txt variant="caption" className="text-center mt-6 mb-2">
        Your data is private to you. sobr · Clear days, counted.
      </Txt>
    </Screen>
  );
}
