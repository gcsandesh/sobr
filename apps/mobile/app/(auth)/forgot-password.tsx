import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LockIcon } from '../../src/components/icons';
import { Button, Screen, TextField, Txt } from '../../src/components/ui';
import {
  MIN_PASSWORD,
  requestPasswordReset,
  resetPasswordWithCode,
} from '../../src/lib/account';
import { authErrorMessage } from '../../src/lib/errorMessage';
import { haptics } from '../../src/lib/haptics';
import { colors } from '../../src/theme';

/**
 * Password reset in two calm steps on one screen: email → (code + new
 * password). Redeeming the code signs the user in; the Gate leaves this route
 * alone while that happens (see `_layout.tsx`) so the new password is set
 * before anyone is routed away.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  async function sendCode() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('That doesn’t look like an email yet.');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep('code');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setError(null);
    // Supabase's OTP length is configurable (6–10); accept any of them.
    if (!/^\d{6,10}$/.test(code.trim())) return setError('Enter the code from the email.');
    if (password.length < MIN_PASSWORD)
      return setError(`Your new password needs at least ${MIN_PASSWORD} characters.`);
    setLoading(true);
    try {
      await resetPasswordWithCode({ email, code, password });
      haptics.success();
      router.replace('/');
    } catch (e) {
      setError(authErrorMessage(e));
      setLoading(false);
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
        <Txt variant="title">{step === 'email' ? 'Reset your password' : 'Check your email'}</Txt>
        <Txt variant="bodyMuted" className="mt-2 mb-6">
          {step === 'email'
            ? 'Enter the email you signed up with and we’ll email you a short code.'
            : `We sent a code to ${email.trim()}. It can take a minute to arrive, so check spam too.`}
        </Txt>

        <View className="gap-4">
          {step === 'email' ? (
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={sendCode}
            />
          ) : (
            <>
              <TextField
                label="Code from the email"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="123456"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <TextField
                ref={passwordRef}
                label="New password"
                value={password}
                onChangeText={setPassword}
                hint={`At least ${MIN_PASSWORD} characters.`}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={reset}
              />
            </>
          )}

          {error && (
            <View className="rounded-xl bg-slip-bg px-4 py-3" accessibilityRole="alert">
              <Txt variant="body" className="text-slip text-sm">
                {error}
              </Txt>
            </View>
          )}

          {step === 'email' ? (
            <Button label="Send code" onPress={sendCode} loading={loading} />
          ) : (
            <>
              <Button label="Set new password" onPress={reset} loading={loading} />
              <Button
                label="Send a new code"
                tone="ghost"
                disabled={loading}
                onPress={() => {
                  setCode('');
                  void sendCode();
                }}
              />
            </>
          )}
          <Button label="Back to sign in" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
