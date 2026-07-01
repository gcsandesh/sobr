import { Redirect } from 'expo-router';

/** The Gate routes here on first sign-in; hand off to the first real step. */
export default function OnboardingIndex() {
  return <Redirect href="/(onboarding)/welcome" />;
}
