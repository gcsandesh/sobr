import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { LockIcon, LogOutIcon, UserIcon } from '../src/components/icons';
import {
  Avatar,
  Button,
  Card,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  TextField,
  Txt,
} from '../src/components/ui';
import { useSession } from '../src/data/SessionProvider';
import { useDeleteAccount } from '../src/data/hooks';
import { MIN_PASSWORD, changePassword, updateDisplayName } from '../src/lib/account';
import { confirmAction } from '../src/lib/confirm';
import { authErrorMessage, errorMessage } from '../src/lib/errorMessage';
import { haptics } from '../src/lib/haptics';
import { colors } from '../src/theme';

/**
 * Everything about *who* you are, in one place: your name, your password, and
 * the exits (sign out, delete). Preferences stay in Settings.
 */
export default function Account() {
  const { email, displayName, greetingName, signOut } = useSession();
  const deleteAccount = useDeleteAccount();

  const [name, setName] = useState(displayName ?? '');
  const [nameState, setNameState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [nameError, setNameError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwState, setPwState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pwError, setPwError] = useState<string | null>(null);

  // the session can arrive after first render (cold start from the cache)
  useEffect(() => setName(displayName ?? ''), [displayName]);

  async function saveName() {
    setNameError(null);
    if (name.trim().length > 40) return setNameError('Keep it under 40 characters.');
    setNameState('saving');
    try {
      await updateDisplayName(name);
      haptics.success();
      setNameState('saved');
    } catch (e) {
      setNameError(authErrorMessage(e));
      setNameState('idle');
    }
  }

  async function savePassword() {
    setPwError(null);
    if (password.length < MIN_PASSWORD)
      return setPwError(`Use at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setPwError('Those two passwords don’t match.');
    setPwState('saving');
    try {
      await changePassword(password);
      haptics.success();
      setPassword('');
      setConfirm('');
      setPwState('saved');
    } catch (e) {
      setPwError(authErrorMessage(e));
      setPwState('idle');
    }
  }

  function confirmDelete() {
    confirmAction({
      title: 'Delete everything?',
      message:
        'This permanently removes your account, every day you’ve logged, and your photos. It can’t be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteAccount.mutate(),
    });
  }

  const nameDirty = name.trim() !== (displayName ?? '');

  return (
    <>
      <Stack.Screen options={{ title: 'Account' }} />
      <Screen scroll edges={['bottom']}>
        <View className="items-center mt-4 mb-8">
          <Avatar name={greetingName} size={72} />
          <Txt variant="heading" className="mt-3">
            {greetingName ?? 'You'}
          </Txt>
          {email ? (
            <Txt variant="caption" className="mt-0.5">
              {email}
            </Txt>
          ) : null}
        </View>

        <SectionHeader title="Your name" />
        <Card className="mb-6">
          <Lead icon={<UserIcon color={colors.accent} size={20} />}>
            How sobr greets you. Only you ever see it.
          </Lead>
          <TextField
            label="Name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameState('idle');
            }}
            error={nameError}
            placeholder="What should we call you?"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="done"
            onSubmitEditing={saveName}
            className="mt-4"
          />
          <Button
            label={nameState === 'saved' && !nameDirty ? 'Saved' : 'Save name'}
            tone="secondary"
            className="mt-3"
            disabled={!nameDirty}
            loading={nameState === 'saving'}
            onPress={saveName}
          />
        </Card>

        <SectionHeader title="Password" />
        <Card className="mb-6">
          <Lead icon={<LockIcon color={colors.accent} size={20} />}>
            Choose something you don’t use anywhere else.
          </Lead>
          <View className="gap-3 mt-4">
            <TextField
              label="New password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setPwState('idle');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="Confirm new password"
              value={confirm}
              onChangeText={(v) => {
                setConfirm(v);
                setPwState('idle');
              }}
              error={pwError}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={savePassword}
            />
          </View>
          <Button
            label={pwState === 'saved' ? 'Password updated' : 'Update password'}
            tone="secondary"
            className="mt-3"
            disabled={!password}
            loading={pwState === 'saving'}
            onPress={savePassword}
          />
        </Card>

        <Card className="mb-3">
          <ListRow
            icon={<LogOutIcon color={colors.textMuted} />}
            title="Sign out"
            subtitle="Your data stays safe in your account."
            onPress={() => void signOut()}
          />
        </Card>

        <Divider className="my-6" />

        <SectionHeader title="Delete account" />
        <Txt variant="bodyMuted" className="mb-3">
          Erases your account and everything in it, for good. There’s no undo and no copy kept.
        </Txt>
        <Button
          label="Delete account & data"
          tone="danger"
          loading={deleteAccount.isPending}
          onPress={confirmDelete}
        />
        {deleteAccount.isError && (
          <Txt variant="caption" className="text-slip mt-2" accessibilityRole="alert">
            Couldn’t delete right now: {errorMessage(deleteAccount.error)}. Nothing was removed.
          </Txt>
        )}
      </Screen>
    </>
  );
}

/** An icon + one line of helper text: the lead-in inside each account card. */
function Lead({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-9 h-9 rounded-xl items-center justify-center bg-accent-bg">{icon}</View>
      <Txt variant="bodyMuted" className="flex-1 text-sm">
        {children}
      </Txt>
    </View>
  );
}
