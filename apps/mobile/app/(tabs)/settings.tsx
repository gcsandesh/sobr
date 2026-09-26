import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { WinMode } from '@sobr/core';
import { CURRENCIES, currencyByCode } from '@sobr/config';
import { BottomSheet } from '../../src/components/BottomSheet';
import { LimitStepper } from '../../src/components/LimitStepper';
import {
  BellIcon,
  ChartIcon,
  DocIcon,
  GlobeIcon,
  InfoIcon,
  LifebuoyIcon,
  ShieldIcon,
  SparkIcon,
  TargetIcon,
  WalletIcon,
} from '../../src/components/icons';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  ListRow,
  Notice,
  OptionList,
  RowValue,
  Screen,
  SectionHeader,
  TextField,
  ToggleRow,
  Txt,
} from '../../src/components/ui';
import { useSession } from '../../src/data/SessionProvider';
import {
  deviceTimeZone,
  useAllEntries,
  useSettings,
  useTimeZone,
  useUpdateSettings,
} from '../../src/data/hooks';
import { todayInTz } from '@sobr/core';
import { exportCsv } from '../../src/lib/exportData';
import { errorMessage } from '../../src/lib/errorMessage';
import { useNotificationPrefs } from '../../src/data/useNotificationPrefs';
import { notificationsSupported } from '../../src/lib/notifications';
import { colors } from '../../src/theme';

const REMINDER_TIMES = [12, 18, 20, 21, 22];
const MOTIVATION_TIMES = [8, 9, 12, 17, 19];
const formatHour = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
};

const MODES: { value: WinMode; title: string; subtitle: string }[] = [
  { value: 'zero', title: 'A clear day', subtitle: 'Any logged drink makes the day a slip.' },
  {
    value: 'limit',
    title: 'Within my limit',
    subtitle: 'Staying at or under a daily limit counts as a win.',
  },
  {
    value: 'manual',
    title: 'I’ll decide each day',
    subtitle: 'Reflect, then call the day yourself.',
  },
];

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

type SheetKey = 'mode' | 'currency' | 'zone' | null;

export default function Settings() {
  const router = useRouter();
  const { email, greetingName } = useSession();
  const settings = useSettings();
  const update = useUpdateSettings();
  const notif = useNotificationPrefs();
  const [sheet, setSheet] = useState<SheetKey>(null);
  const entriesQ = useAllEntries();
  const tz = useTimeZone();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function doExport() {
    setExportError(null);
    setExporting(true);
    try {
      await exportCsv(entriesQ.data ?? [], todayInTz(tz));
    } catch (e) {
      setExportError(errorMessage(e, 'Couldn’t create the file. Try again?'));
    } finally {
      setExporting(false);
    }
  }

  const s = settings.data;

  const device = deviceTimeZone();
  const zones = [device, ...COMMON_ZONES.filter((z) => z !== device)];
  const modeTitle = MODES.find((m) => m.value === s?.winMode)?.title;
  const modeValue =
    s?.winMode === 'limit' ? `${modeTitle} · ${s.dailyLimitUnits}u` : modeTitle ?? '';

  return (
    <Screen scroll>
      <Txt variant="title" className="mt-2 mb-6">
        Settings
      </Txt>

      {/* ── Account ─────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <ListRow
          icon={<Avatar name={greetingName} size={40} />}
          title={greetingName ?? 'Your account'}
          subtitle={email ?? undefined}
          right={<RowValue />}
          onPress={() => router.push('/account')}
          accessibilityLabel="Account: name, password, sign out"
        />
      </Card>

      {/* ── Your rules ──────────────────────────────────────────────── */}
      <SectionHeader title="Your rules" />
      <Card className="mb-6">
        <ListRow
          icon={<TargetIcon color={colors.accent} />}
          title="What counts as a win"
          right={<RowValue value={modeValue} />}
          onPress={() => setSheet('mode')}
        />
        <Divider className="my-1" />
        <ListRow
          icon={<WalletIcon color={colors.accent} />}
          title="Currency"
          right={<RowValue value={s ? `${currencyByCode(s.currency).symbol} ${s.currency}` : ''} />}
          onPress={() => setSheet('currency')}
        />
        <Divider className="my-1" />
        <ListRow
          icon={<GlobeIcon color={colors.accent} />}
          title="Time zone"
          subtitle="Decides when your day rolls over"
          right={<RowValue value={s?.timeZone.split('/').pop()?.replace(/_/g, ' ')} />}
          onPress={() => setSheet('zone')}
        />
      </Card>

      {/* ── Notifications (device-local; native only) ───────────────── */}
      {Platform.OS !== 'web' && !notificationsSupported && (
        <>
          <SectionHeader title="Notifications" caption="stays on this device" />
          <Notice
            tone="info"
            title="Not available in Expo Go"
            message="Notifications work in the installed app. Expo Go on Android dropped support in SDK 53."
          />
          <View className="mb-6" />
        </>
      )}
      {notificationsSupported && (
        <>
          <SectionHeader title="Notifications" caption="stays on this device" />
          <Card className="mb-6">
            <ToggleRow
              icon={<BellIcon color={colors.accent} />}
              title="Daily check-in"
              subtitle="One quiet nudge a day to reflect and log."
              value={notif.checkinEnabled}
              disabled={notif.busy || !notif.loaded}
              onValueChange={(v) => void notif.toggleCheckin(v)}
            />
            {notif.checkinEnabled && (
              <View className="flex-row flex-wrap gap-2 mt-1 mb-2">
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
            <Divider className="my-2" />
            <ToggleRow
              icon={<SparkIcon color={colors.accent} />}
              title="Daily motivation"
              subtitle="A warm note, different every day of the week."
              value={notif.motivationEnabled}
              disabled={notif.busy || !notif.loaded}
              onValueChange={(v) => void notif.toggleMotivation(v)}
            />
            {notif.motivationEnabled && (
              <View className="flex-row flex-wrap gap-2 mt-1 mb-2">
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

      {/* ── Email (server-side; sent even when the app is closed) ───── */}
      <SectionHeader title="Email" caption="sent to your inbox" />
      <Card className="mb-6">
        <ToggleRow
          icon={<BellIcon color={colors.accent} />}
          title="Daily reminder"
          subtitle="At 8pm your time, only on days you haven’t checked in."
          value={s?.emailReminders ?? true}
          disabled={!s || update.isPending}
          onValueChange={(v) => update.mutate({ emailReminders: v })}
        />
        <Divider className="my-2" />
        <ToggleRow
          icon={<ChartIcon color={colors.accent} />}
          title="Weekly progress"
          subtitle="Your week in review, every Sunday evening."
          value={s?.emailWeekly ?? true}
          disabled={!s || update.isPending}
          onValueChange={(v) => update.mutate({ emailWeekly: v })}
        />
      </Card>

      {/* ── Your data ───────────────────────────────────────────────── */}
      <SectionHeader
        title="Your data"
        caption={entriesQ.data ? `${entriesQ.data.length} days logged` : undefined}
      />
      <Card className="mb-6">
        <ListRow
          icon={<DocIcon color={colors.accent} />}
          title={exporting ? 'Preparing your file…' : 'Export as spreadsheet'}
          subtitle="Every day as a CSV file: status, units, spend, notes"
          right={<RowValue />}
          onPress={exporting || !entriesQ.data ? undefined : () => void doExport()}
        />
        {exportError ? (
          <Txt variant="caption" className="text-slip mt-1" accessibilityRole="alert">
            {exportError}
          </Txt>
        ) : null}
      </Card>

      {/* ── Help & info ─────────────────────────────────────────────── */}
      <SectionHeader title="Help & info" />
      <Card>
        <ListRow
          icon={<LifebuoyIcon color={colors.accent} />}
          title="Support"
          subtitle="Helplines, peer groups, stopping safely"
          right={<RowValue />}
          onPress={() => router.push('/support')}
        />
        <Divider className="my-1" />
        <ListRow
          icon={<InfoIcon color={colors.accent} />}
          title="About sobr"
          right={<RowValue />}
          onPress={() => router.push('/about')}
        />
        <Divider className="my-1" />
        <ListRow
          icon={<ShieldIcon color={colors.accent} />}
          title="Privacy policy"
          right={<RowValue />}
          onPress={() => router.push('/legal/privacy')}
        />
        <Divider className="my-1" />
        <ListRow
          icon={<DocIcon color={colors.accent} />}
          title="Terms of use"
          right={<RowValue />}
          onPress={() => router.push('/legal/terms')}
        />
      </Card>

      <Txt variant="caption" className="text-center mt-6 mb-2">
        Your data is private to you. sobr · Clear days, counted.
      </Txt>

      {/* ── sheets ──────────────────────────────────────────────────── */}
      <BottomSheet visible={sheet === 'mode'} onClose={() => setSheet(null)} title="What counts as a win">
        <OptionList
          options={MODES}
          value={s?.winMode}
          onChange={(mode) => update.mutate({ winMode: mode })}
        />
        {s?.winMode === 'limit' && (
          <LimitStepper
            value={s.dailyLimitUnits}
            onChange={(v) => update.mutate({ dailyLimitUnits: v })}
          />
        )}
        <Txt variant="caption" className="mt-4">
          Days you’ve already logged keep the result they were saved with.
        </Txt>
      </BottomSheet>

      <BottomSheet visible={sheet === 'currency'} onClose={() => setSheet(null)} title="Currency">
        <OptionList
          options={CURRENCIES.map((c) => ({
            value: c.code,
            title: `${c.symbol}  ${c.code}`,
            subtitle: c.name,
          }))}
          value={s?.currency}
          onChange={(code) => {
            update.mutate({ currency: code });
            setSheet(null);
          }}
        />
      </BottomSheet>

      <BottomSheet visible={sheet === 'zone'} onClose={() => setSheet(null)} title="Time zone">
        <OptionList
          options={zones.map((z) => ({
            value: z,
            title: z.replace(/_/g, ' '),
            subtitle: z === device ? 'This device' : undefined,
          }))}
          value={s?.timeZone}
          onChange={(z) => {
            update.mutate({ timeZone: z });
            setSheet(null);
          }}
        />
      </BottomSheet>
    </Screen>
  );
}
