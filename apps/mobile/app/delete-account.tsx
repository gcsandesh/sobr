import { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { CheckIcon, DocIcon, HomeLeafIcon, TrashIcon } from '../src/components/icons';
import { Button, Card, Row, Screen, SectionHeader, Txt } from '../src/components/ui';
import { useSession } from '../src/data/SessionProvider';
import { confirmAction } from '../src/lib/confirm';
import { errorMessage } from '../src/lib/errorMessage';
import { exportBackup, requestAccountDeletion, takeBreak } from '../src/lib/lifecycle';
import { colors } from '../src/theme';

/**
 * Deleting, done carefully: offer the user their own backup first, offer a
 * break as the gentler option, say exactly what happens and when, then ask
 * for a typed confirmation. Deletion is final after 30 days; until then,
 * signing in offers Restore.
 */
export default function DeleteAccount() {
  const { userId } = useSession();
  const [backedUp, setBackedUp] = useState(false);
  const [busy, setBusy] = useState<'backup' | 'break' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: 'backup' | 'break' | 'delete', fn: () => Promise<void>) {
    setError(null);
    setBusy(kind);
    try {
      await fn();
      if (kind === 'backup') setBackedUp(true);
    } catch (e) {
      setError(errorMessage(e, 'Something went wrong. Nothing was changed.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Delete account' }} />
      <Screen scroll edges={['bottom']}>
        <Txt variant="title" className="mt-2">
          Before you go
        </Txt>
        <Txt variant="bodyMuted" className="mt-2 mb-6">
          Two things worth a moment, then the details.
        </Txt>

        <SectionHeader title="1. Keep a copy of your data" />
        <Card className="mb-6">
          <Row className="gap-3 items-start">
            <View className="w-10 h-10 rounded-lg items-center justify-center bg-accent-bg">
              {backedUp ? <CheckIcon color={colors.accent} /> : <DocIcon color={colors.accent} />}
            </View>
            <Txt variant="bodyMuted" className="flex-1 text-sm">
              A backup file with every day, drink and note. It stays with you, not us. If you
              ever come back, Settings → Your data → Restore brings it all back.
            </Txt>
          </Row>
          <Button
            label={backedUp ? 'Backup saved' : 'Download my backup'}
            tone="secondary"
            className="mt-4"
            loading={busy === 'backup'}
            onPress={() => userId && void run('backup', () => exportBackup(userId))}
          />
        </Card>

        <SectionHeader title="2. Need a break instead?" />
        <Card className="mb-6">
          <Row className="gap-3 items-start">
            <View className="w-10 h-10 rounded-lg items-center justify-center bg-win-bg">
              <HomeLeafIcon color={colors.win} />
            </View>
            <Txt variant="bodyMuted" className="flex-1 text-sm">
              Taking a break pauses reminders and emails and signs you out. Nothing is deleted,
              with no time limit: sign in whenever you’re ready and pick up where you left off.
            </Txt>
          </Row>
          <Button
            label="Take a break instead"
            tone="win"
            className="mt-4"
            loading={busy === 'break'}
            onPress={() =>
              confirmAction({
                tone: 'calm',
                title: 'Take a break?',
                message:
                  'Reminders and emails stop and you’ll be signed out. Everything stays exactly as it is until you sign in again.',
                confirmLabel: 'Take a break',
                cancelLabel: 'Cancel',
                onConfirm: () => userId && void run('break', () => takeBreak(userId)),
              })
            }
          />
        </Card>

        <SectionHeader title="What deleting does" />
        <Card className="mb-6">
          {[
            'Your photos are removed right away.',
            'Everything else (days, drinks, notes, streaks) is permanently erased after 30 days.',
            'Changed your mind? Sign in within those 30 days and choose Restore.',
            'After that there’s no undo and no copy kept, except any backup you saved.',
          ].map((line) => (
            <Row key={line} className="gap-2 items-start mb-2">
              <Txt variant="body" style={{ color: colors.slip }}>
                •
              </Txt>
              <Txt variant="bodyMuted" className="flex-1 text-sm">
                {line}
              </Txt>
            </Row>
          ))}
        </Card>

        <Button
          label="Delete my account"
          tone="danger"
          loading={busy === 'delete'}
          onPress={() =>
            confirmAction({
              title: 'Delete your account?',
              message: backedUp
                ? 'Photos are removed now; everything else is erased in 30 days unless you sign in and restore.'
                : 'You haven’t saved a backup. Photos are removed now; everything else is erased in 30 days unless you sign in and restore.',
              confirmLabel: 'Delete',
              cancelLabel: 'Keep my account',
              requireText: 'DELETE',
              onConfirm: () => userId && void run('delete', () => requestAccountDeletion(userId)),
            })
          }
        />
        {error && (
          <Txt variant="caption" className="text-slip mt-3" accessibilityRole="alert">
            {error}
          </Txt>
        )}
        <Row className="gap-2 justify-center mt-6 mb-2">
          <TrashIcon color={colors.textFaint} size={14} />
          <Txt variant="caption">Deletion requests can also be sent via the Support page.</Txt>
        </Row>
      </Screen>
    </>
  );
}
