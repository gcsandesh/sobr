import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LockIcon } from '../../src/components/icons';
import { Button, Screen, TextField, Txt } from '../../src/components/ui';
import { MIN_PASSWORD, changePassword } from '../../src/lib/account';
import { authErrorMessage } from '../../src/lib/errorMessage';
import { haptics } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme';

/**
 * Landing screen for the reset email's link (sobr://reset-password?code=…).
 *
 * The link carries a PKCE code; exchanging it signs the user in as a recovery
 * session, and then they choose a new password. The exchange only works on
 * the device that requested the reset (the code verifier lives there), so a
 * link opened elsewhere gets a clear "request a new one" message.
 *
 * The Gate leaves this route alone whether signed in or not (_layout.tsx).
 */
export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [state, setState] = useState<'verifying' | 'ready' | 'failed'>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const exchanged = useRef(false);
  const completed = useRef(false);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (params.error || params.error_description) {
        if (active) setState('failed');
        return;
      }
      try {
        if (params.code) {
          const { error: err } = await supabase.auth.exchangeCodeForSession(String(params.code));
          if (err) throw err;
          exchanged.current = true;
        } else {
          // no code (e.g. reopened): fine if a recovery session already exists
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error('no session');
        }
        if (active) setState('ready');
      } catch {
        if (active) setState('failed');
      }
    })();
    return () => {
      active = false;
    };
  }, [params.code, params.error, params.error_description]);

  // Leaving before the new password is saved must not leave the recovery
  // session behind (the Gate would treat it as a normal sign-in).
  useEffect(
    () => () => {
      if (exchanged.current && !completed.current) void supabase.auth.signOut();
    },
    [],
  );

  async function save() {
    setError(null);
    if (password.length < MIN_PASSWORD)
      return setError(`Use at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError('Those two passwords don’t match.');
    setSaving(true);
    try {
      await changePassword(password);
      completed.current = true;
      haptics.success();
      router.replace('/');
    } catch (e) {
      setError(authErrorMessage(e));
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View className="flex-1 justify-center py-10">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-5"
          style={{ backgroundColor: colors.accentBg }}
        >
          <LockIcon color={colors.accent} size={26} />
        </View>

        {state === 'verifying' && (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.accent} />
            <Txt variant="bodyMuted" className="mt-3">
              Checking your reset link…
            </Txt>
          </View>
        )}

        {state === 'failed' && (
          <>
            <Txt variant="title">This link didn’t work</Txt>
            <Txt variant="bodyMuted" className="mt-2 mb-6">
              Reset links expire after an hour, work once, and only on the phone that asked for
              them. Request a fresh one and open it on this phone.
            </Txt>
            <Button
              label="Request a new link"
              onPress={() => router.replace('/(auth)/forgot-password')}
            />
            <Button
              label="Back to sign in"
              tone="ghost"
              className="mt-2"
              onPress={() => router.replace('/(auth)/sign-in')}
            />
          </>
        )}

        {state === 'ready' && (
          <>
            <Txt variant="title">Choose a new password</Txt>
            <Txt variant="bodyMuted" className="mt-2 mb-6">
              You’ll stay signed in on this phone once it’s saved.
            </Txt>
            <View className="gap-4">
              <TextField
                label="New password"
                value={password}
                onChangeText={setPassword}
                hint={`At least ${MIN_PASSWORD} characters.`}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <TextField
                ref={confirmRef}
                label="Confirm new password"
                value={confirm}
                onChangeText={setConfirm}
                error={error}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={save}
              />
              <Button label="Save new password" onPress={save} loading={saving} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
