import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Logo } from '../../src/components/Logo';
import { Button, Screen, TextField, Txt } from '../../src/components/ui';
import { MIN_PASSWORD } from '../../src/lib/account';
import { authErrorMessage } from '../../src/lib/errorMessage';
import { supabase } from '../../src/lib/supabase';

/**
 * Email + password sign-in, one screen for both modes.
 *
 * Deliberately no email verification and no magic links: sending mail needs a
 * verified domain and custom SMTP, which blocked sign-in entirely (see
 * HANDOVER → "Email sign-in"). Password auth issues a session immediately, so
 * `auth.uid()` is real and every RLS policy keeps working untouched.
 *
 * Requires Supabase → Authentication → Providers → Email → **Confirm email OFF**.
 * With it on, sign-up returns a user but no session; `submit` detects that
 * exact case and says so rather than failing silently.
 */
export default function SignIn() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const isSignUp = mode === 'signUp';

  async function submit() {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    const mail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setEmailError('That doesn’t look like an email yet.');
    // Supabase itself rejects < 6; check here so the error is instant and kind.
    if (password.length < MIN_PASSWORD)
      return setPasswordError(`Use at least ${MIN_PASSWORD} characters.`);

    setLoading(true);
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email: mail, password })
      : await supabase.auth.signInWithPassword({ email: mail, password });
    setLoading(false);

    if (error) return setFormError(authErrorMessage(error));
    if (isSignUp && !data.session) {
      // Confirm-email is still on in the dashboard — no session was issued, so
      // the Gate would leave us sitting here with no feedback at all.
      return setFormError(
        'Account made, but this project still requires email confirmation. Turn off Authentication → Providers → Email → Confirm email, then sign in.',
      );
    }
    // Gate routes onward as soon as the session lands.
  }

  function switchMode() {
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);
    setMode(isSignUp ? 'signIn' : 'signUp');
  }

  return (
    <Screen scroll>
      <View className="flex-1 justify-center py-10">
        <Animated.View entering={FadeInDown.duration(450)} className="items-center mb-10">
          <Logo size={80} />
          <Txt variant="display" className="mt-6">
            sobr
          </Txt>
          <Txt variant="bodyMuted" className="mt-2">
            Clear days, counted.
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(450)}>
          <Txt variant="title" className="mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Txt>
          <Txt variant="bodyMuted" className="mb-6">
            {isSignUp
              ? 'Private to you. Nothing you log is ever shared.'
              : 'Sign in to pick up where you left off.'}
          </Txt>

          <View className="gap-4">
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              hint={isSignUp ? `At least ${MIN_PASSWORD} characters.` : undefined}
              placeholder={isSignUp ? 'Choose a password' : 'Your password'}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {!isSignUp && (
              <Link href="/forgot-password" asChild>
                <Pressable
                  accessibilityRole="link"
                  className="self-end min-h-[44px] justify-center -mt-2 active:opacity-70"
                >
                  <Txt variant="label" className="text-accent">
                    Forgot password?
                  </Txt>
                </Pressable>
              </Link>
            )}

            {formError && (
              <View className="rounded-xl bg-slip-bg px-4 py-3" accessibilityRole="alert">
                <Txt variant="body" className="text-slip text-sm">
                  {formError}
                </Txt>
              </View>
            )}

            <Button
              label={isSignUp ? 'Create account' : 'Sign in'}
              onPress={submit}
              loading={loading}
            />
            <Button
              label={isSignUp ? 'I already have an account' : 'New here? Create an account'}
              tone="ghost"
              onPress={switchMode}
            />
          </View>
        </Animated.View>
      </View>
    </Screen>
  );
}
