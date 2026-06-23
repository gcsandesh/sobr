import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Logo } from '../../src/components/Logo';
import { GoogleIcon } from '../../src/components/icons';
import { Button, Divider, Row, Screen, Txt } from '../../src/components/ui';
import { signInWithGoogle } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme';

/**
 * Email OTP sign-in. Two steps: enter email → enter the 6-digit code. Calm,
 * minimal, no passwords. Copy stays warm and never mentions what we track.
 */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!email.includes('@')) return Alert.alert('Enter a valid email');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) return Alert.alert('Could not send code', error.message);
    setStage('code');
  }

  async function verify() {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setLoading(false);
    if (error) return Alert.alert('That code didn’t work', error.message);
    // Gate will route onward once the session lands.
  }

  const [googleLoading, setGoogleLoading] = useState(false);
  async function google() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('Google sign-in failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <View className="items-center mb-10">
          <Logo size={84} />
          <Txt variant="display" className="mt-6">
            sobr
          </Txt>
          <Txt variant="bodyMuted" className="mt-2">
            Clear days, counted.
          </Txt>
        </View>

        {stage === 'email' ? (
          <View className="gap-3">
            <Txt variant="label">Your email</Txt>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              className="bg-surface border border-border rounded-xl px-4 py-4 text-text font-sans text-base"
            />
            <Button label="Send me a code" onPress={sendCode} loading={loading} />
            <Txt variant="caption" className="text-center mt-2">
              No passwords. We’ll email you a one-time code.
            </Txt>

            <Row className="my-4">
              <Divider className="flex-1" />
              <Txt variant="caption" className="mx-3">
                or
              </Txt>
              <Divider className="flex-1" />
            </Row>

            <Pressable
              onPress={google}
              disabled={googleLoading}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              className={`min-h-[52px] rounded-xl flex-row items-center justify-center gap-3 bg-surface-raised border border-border ${
                googleLoading ? 'opacity-50' : 'active:opacity-80'
              }`}
            >
              <GoogleIcon size={20} />
              <Txt variant="body" className="font-semibold">
                Continue with Google
              </Txt>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            <Txt variant="label">Enter the 6-digit code sent to {email}</Txt>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              maxLength={6}
              className="bg-surface border border-border rounded-xl px-4 py-4 text-text font-sans text-2xl tracking-[8px] text-center"
            />
            <Button label="Continue" onPress={verify} loading={loading} />
            <Button label="Use a different email" tone="ghost" onPress={() => setStage('email')} />
          </View>
        )}
      </View>
    </Screen>
  );
}
