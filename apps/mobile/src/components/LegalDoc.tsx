import { Linking, Pressable, View } from 'react-native';
import { LEGAL_CONTACT_URL, LEGAL_UPDATED, type LegalSection } from '../content/legal';
import { Screen, Txt } from './ui';

/** Renders a privacy/terms document: calm reading layout, one column. */
export function LegalDoc({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <Screen scroll edges={['bottom']}>
      <Txt variant="title" className="mt-2">
        {title}
      </Txt>
      <Txt variant="caption" className="mt-1 mb-6">
        Last updated {LEGAL_UPDATED}
      </Txt>
      {sections.map((s) => (
        <View key={s.heading} className="mb-6">
          <Txt variant="heading" className="mb-2">
            {s.heading}
          </Txt>
          {s.body.map((p, i) => (
            <Txt key={i} variant="bodyMuted" className="mb-2">
              {p}
            </Txt>
          ))}
        </View>
      ))}
      <Pressable
        onPress={() => void Linking.openURL(LEGAL_CONTACT_URL)}
        accessibilityRole="link"
        className="min-h-[44px] justify-center mb-4 active:opacity-70"
      >
        <Txt variant="body" className="text-accent font-semibold">
          Contact: project page →
        </Txt>
      </Pressable>
    </Screen>
  );
}
