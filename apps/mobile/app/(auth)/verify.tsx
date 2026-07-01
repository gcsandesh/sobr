import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Logo } from '../../src/components/Logo';
import { Button, Screen, Txt } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme';

/**
 * Step two of email-OTP sign-in: enter the 6-digit code. A back button (native
 * header, or the "Use a different email" link) returns to sign-in naturally
 * via router.back() instead of local stage-toggling.
 */
export default function Verify() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setLoading(false);
    if (error) return Alert.alert('That code didn’t work', error.message);
    // Gate will route onward once the session lands.
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
          <Button label="Use a different email" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
