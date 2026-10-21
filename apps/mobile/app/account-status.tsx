import { useState } from 'react';
import { View } from 'react-native';
import { Logo } from '../src/components/Logo';
import { Button, Card, GradientButton, Screen, Txt } from '../src/components/ui';
import { useSession } from '../src/data/SessionProvider';
import { useAllEntries, useSettings, useUpdateSettings } from '../src/data/hooks';
import { confirmAction } from '../src/lib/confirm';
import { errorMessage } from '../src/lib/errorMessage';
import { erasureDate, exportBackup } from '../src/lib/lifecycle';
import { colors } from '../src/theme';

/**
 * Where a signed-in account lands while it's on a break or scheduled for
 * deletion (the Gate holds it here). Coming back is one confirmed step; until
 * then nothing in the app is reachable, so a paused account stays paused.
 */
export default function AccountStatus() {
  const { userId, greetingName, signOut } = useSession();
  const settings = useSettings();
  const entries = useAllEntries();
  const update = useUpdateSettings();
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const s = settings.data;
  const deleting = !!s?.deletionRequestedAt;
  const days = entries.data?.length ?? 0;
  const eraseOn = s?.deletionRequestedAt
    ? erasureDate(s.deletionRequestedAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  function comeBack() {
    setError(null);
    confirmAction({
      tone: 'calm',
      title: deleting ? 'Restore your account?' : 'Welcome back',
      message: deleting
        ? 'Your deletion will be cancelled and everything you logged stays. Photos were already removed when you asked to delete.'
        : 'Your account will be active again, with every day, note and streak just as you left them.',
      confirmLabel: deleting ? 'Restore' : 'Resume',
      cancelLabel: 'Not yet',
      onConfirm: () =>
        update.mutate(
          deleting ? { deletionRequestedAt: null, pausedAt: null } : { pausedAt: null },
          { onError: (e) => setError(errorMessage(e, 'Couldn’t update your account. Try again.')) },
        ),
    });
  }

  async function backup() {
    if (!userId) return;
    setExporting(true);
    try {
      await exportBackup(userId);
    } catch (e) {
      setError(errorMessage(e, 'Couldn’t create the backup.'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen scroll>
      <View className="flex-1 justify-center py-10">
        <View className="items-center mb-8">
          <Logo size={72} />
        </View>

        {deleting ? (
          <>
            <Txt variant="title" className="text-center">
              Your account is scheduled for deletion
            </Txt>
            <Txt variant="bodyMuted" className="text-center mt-3">
              On {eraseOn}, your account and every logged day will be permanently erased. Until
              then you can still change your mind.
            </Txt>
          </>
        ) : (
          <>
            <Txt variant="title" className="text-center">
              Welcome back{greetingName ? `, ${greetingName.split(' ')[0]}` : ''}
            </Txt>
            <Txt variant="bodyMuted" className="text-center mt-3">
              Your account is on a break. Nothing was deleted: everything is just as you left it.
            </Txt>
          </>
        )}

        <Card className="mt-6 items-center">
          <Txt variant="displaySm" style={{ color: colors.accent }}>
            {days}
          </Txt>
          <Txt variant="label" className="mt-1">
            {days === 1 ? 'day logged' : 'days logged'}
          </Txt>
        </Card>

        <View className="gap-3 mt-8">
          <GradientButton
            label={deleting ? 'Restore my account' : 'Resume my account'}
            onPress={comeBack}
            loading={update.isPending}
          />
          {deleting && (
            <Button
              label="Download a backup"
              tone="secondary"
              loading={exporting}
              onPress={() => void backup()}
            />
          )}
          <Button
            label={deleting ? 'Sign out' : 'Stay on a break'}
            tone="ghost"
            onPress={() => void signOut()}
          />
        </View>

        {error && (
          <Txt variant="caption" className="text-slip text-center mt-3" accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </View>
    </Screen>
  );
}
