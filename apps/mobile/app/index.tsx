import { View } from 'react-native';

/**
 * Root entry ("/"). Renders nothing but the background — the Gate in _layout
 * redirects away on its first effect, and every branch there already handles a
 * bare root segment.
 *
 * It exists so cold start has a defined destination. Without it expo-router
 * falls through to the first group that happens to own an index route, which
 * was `(onboarding)` — so the app booted into onboarding and, with no session,
 * stranded on a screen whose only button (Plant my tree) can never succeed.
 */
export default function Index() {
  return <View className="flex-1 bg-bg" />;
}
