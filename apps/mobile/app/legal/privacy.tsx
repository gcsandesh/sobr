import { Stack } from 'expo-router';
import { LegalDoc } from '../../src/components/LegalDoc';
import { PRIVACY } from '../../src/content/legal';

export default function Privacy() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy' }} />
      <LegalDoc title="Privacy policy" sections={PRIVACY} />
    </>
  );
}
