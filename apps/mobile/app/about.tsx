import { View } from 'react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { Logo } from '../src/components/Logo';
import { Card, Screen, SectionHeader, Txt } from '../src/components/ui';
import { colors } from '../src/theme';

/** A calm about/privacy page — standard, low-key, reachable from Settings. */
export default function About() {
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          title: 'About sobr',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
        }}
      />
      <Screen scroll>
        <View className="items-center mt-6 mb-8">
          <Logo size={72} />
          <Txt variant="title" className="mt-4">
            sobr
          </Txt>
          <Txt variant="caption" className="mt-1">
            Version {version} · Clear days, counted.
          </Txt>
        </View>

        <SectionHeader title="What sobr is" />
        <Card className="mb-6">
          <Txt variant="body">
            A calm, private companion for building a steadier relationship with something you'd
            rather have less of. Check in daily, watch a streak and a tree grow, and look back
            over a gentle calendar — never a clinical tracker, never punitive.
          </Txt>
        </Card>

        <SectionHeader title="Your privacy" />
        <Card className="mb-6">
          <Txt variant="body">
            Your data is yours alone. Every row in the database is isolated to your account —
            nobody else, including us, can read it. Nothing you log is used for analytics or
            shared with third parties. Deleting your account genuinely erases everything, for
            good.
          </Txt>
        </Card>

        <SectionHeader title="Notifications" />
        <Card className="mb-6">
          <Txt variant="body">
            Push reminders and motivation notes are scheduled entirely on your device. Nothing
            about them — timing, content, whether you have them on — ever leaves your phone.
          </Txt>
          <Txt variant="bodyMuted" className="mt-3">
            Email is the one exception: the daily reminder and the Sunday progress email are sent
            from our server, so they reach you even when the app is closed. They contain only your
            own numbers, and you can switch them off any time in Settings → Email.
          </Txt>
        </Card>

        <Txt variant="caption" className="text-center mb-2">
          Made with care, one clear day at a time.
        </Txt>
      </Screen>
    </View>
  );
}
