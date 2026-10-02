import { Stack } from 'expo-router';
import { LegalDoc } from '../../src/components/LegalDoc';
import { TERMS } from '../../src/content/legal';

export default function Terms() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms' }} />
      <LegalDoc title="Terms of use" sections={TERMS} />
    </>
  );
}
