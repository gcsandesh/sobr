import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Logo } from '../../src/components/Logo';
import { Button, Screen, Txt } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme';

/**
 * Email + password sign-in, one screen for both modes.
 *
 * Deliberately no email verification and no magic links: sending mail needs a
 * verified domain and custom SMTP, which blocked sign-in entirely (see
 * HANDOVER → "Email sign-in"). Password auth issues a session immediately, so
 * `auth.uid()` is real and every RLS policy keeps working untouched.
 *
 * Requires Supabase → Authentication → Providers → Email → **Confirm email OFF**.
 * With it on, sign-up returns a user but no session; `afterSignUp` detects that
 * exact case and says so rather than failing silently.
 */
export default function SignIn() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  async function submit() {
    setError(null);
    const mail = email.trim();
    if (!mail.includes('@')) return setError('That doesn’t look like an email — try again?');
    // Supabase itself rejects < 6; check here so the error is instant and kind.
    if (password.length < 6) return setError('Password needs at least 6 characters.');

    setLoading(true);
    const { data, error: err } = isSignUp
      ? await supabase.auth.signUp({ email: mail, password })
      : await supabase.auth.signInWithPassword({ email: mail, password });
    setLoading(false);

    if (err) return setError(err.message);
    if (isSignUp && !data.session) {
      // Confirm-email is still on in the dashboard — no session was issued, so
      // the Gate would leave us sitting here with no feedback at all.
      return setError(
        'Account made, but this project still requires email confirmation. Turn off Authentication → Providers → Email → Confirm email, then sign in.',
      );
    }
    // Gate routes onward as soon as the session lands.
  }

  return (
    <Screen scroll>
      <View className="flex-1 justify-center py-8">
        <View className="items-center mb-10">
          <Logo size={84} />
          <Txt variant="display" className="mt-6">
            sobr
          </Txt>
          <Txt variant="bodyMuted" className="mt-2">
            Clear days, counted.
          </Txt>
        </View>

        <View className="gap-3">
          <Txt variant="label">Your email</Txt>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            className="bg-surface border border-border rounded-xl px-4 py-4 text-text font-sans text-base"
          />

          <Txt variant="label" className="mt-1">
            Password
          </Txt>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onSubmitEditing={submit}
            returnKeyType="go"
            className="bg-surface border border-border rounded-xl px-4 py-4 text-text font-sans text-base"
          />

          {error && (
            <Txt variant="body" className="text-slip text-sm">
              {error}
            </Txt>
          )}

          <Button
            label={isSignUp ? 'Create account' : 'Sign in'}
            onPress={submit}
            loading={loading}
          />

          <Button
            label={isSignUp ? 'I already have an account' : 'Create an account'}
            tone="ghost"
            onPress={() => {
              setError(null);
              setMode(isSignUp ? 'signIn' : 'signUp');
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
