import { Linking, Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRightIcon, InfoIcon, LifebuoyIcon, SparkIcon } from '../src/components/icons';
import { Card, Row, Screen, SectionHeader, Txt } from '../src/components/ui';
import { colors } from '../src/theme';

/**
 * Where to turn when an app isn't enough. Kept factual and calm: numbers that
 * can be tapped, a directory that covers every country, and one plain medical
 * caution. Nothing here is tracked or logged.
 *
 * Numbers: verify before each store release (see DEPLOY.md). The directory
 * link is the fallback that stays correct when local numbers change.
 */

type Contact = { title: string; detail: string; action: string; href: string };

const URGENT: Contact[] = [
  {
    title: 'Emergency services',
    detail: 'If you or someone else is in danger right now, call your local emergency number.',
    action: 'Nepal: Ambulance 102',
    href: 'tel:102',
  },
  {
    title: 'Someone to talk to',
    detail: 'Free, confidential support if things feel heavy (Nepal, national helpline).',
    action: 'Call 1166',
    href: 'tel:1166',
  },
  {
    title: 'Helplines in any country',
    detail: 'Find a free, confidential helpline wherever you are, by phone, text or chat.',
    action: 'findahelpline.com',
    href: 'https://findahelpline.com',
  },
];

const GROUPS: Contact[] = [
  {
    title: 'SMART Recovery',
    detail: 'Practical, science-based meetings, online and in person.',
    action: 'smartrecovery.org',
    href: 'https://smartrecovery.org',
  },
  {
    title: 'Alcoholics Anonymous',
    detail: 'Free peer-support meetings in most countries, including online.',
    action: 'aa.org',
    href: 'https://www.aa.org',
  },
];

export default function Support() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Support' }} />
      <Screen scroll edges={['bottom']}>
        <View className="mt-2 mb-6">
          <View className="w-12 h-12 rounded-2xl items-center justify-center bg-accent-bg mb-4">
            <LifebuoyIcon color={colors.accent} size={26} />
          </View>
          <Txt variant="title">You don’t have to do this alone</Txt>
          <Txt variant="bodyMuted" className="mt-2">
            Reaching out is a strong move, not a last resort. Tap any of these to call or open
            them. Nothing here is recorded.
          </Txt>
        </View>

        <SectionHeader title="Right now" />
        <View className="gap-3 mb-6">
          {URGENT.map((c) => (
            <ContactCard key={c.title} contact={c} />
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/steady')}
          accessibilityRole="button"
          className="mb-6 active:opacity-80"
        >
          <Card className="flex-row items-center">
            <View className="w-10 h-10 rounded-full items-center justify-center bg-accent-bg">
              <SparkIcon color={colors.accent} />
            </View>
            <View className="flex-1 ml-3">
              <Txt variant="body">Riding out a craving?</Txt>
              <Txt variant="caption" className="mt-0.5">
                Open Steady for a minute of slow breathing
              </Txt>
            </View>
            <ChevronRightIcon color={colors.textFaint} />
          </Card>
        </Pressable>

        <SectionHeader title="Peer support" />
        <View className="gap-3 mb-6">
          {GROUPS.map((c) => (
            <ContactCard key={c.title} contact={c} />
          ))}
        </View>

        <Card className="border-frozen mb-4" style={{ backgroundColor: colors.frozenBg }}>
          <Row className="gap-3 items-start">
            <InfoIcon color={colors.frozen} />
            <View className="flex-1">
              <Txt variant="body" className="font-semibold">
                A note on stopping safely
              </Txt>
              <Txt variant="bodyMuted" className="mt-1 text-sm">
                If you’ve been drinking heavily every day, stopping all at once can be medically
                risky. Talk to a doctor or pharmacist first; they can help you cut back safely.
              </Txt>
            </View>
          </Row>
        </Card>

        <Txt variant="caption" className="text-center mt-2">
          sobr is a companion, not medical care.
        </Txt>
      </Screen>
    </>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(contact.href)}
      accessibilityRole={contact.href.startsWith('tel:') ? 'button' : 'link'}
      accessibilityLabel={`${contact.title}. ${contact.action}`}
      className="active:opacity-80"
    >
      <Card>
        <Txt variant="body" className="font-semibold">
          {contact.title}
        </Txt>
        <Txt variant="bodyMuted" className="text-sm mt-1">
          {contact.detail}
        </Txt>
        <Row className="mt-3 gap-1">
          <Txt variant="body" className="text-accent font-semibold">
            {contact.action}
          </Txt>
          <ChevronRightIcon color={colors.accent} size={18} />
        </Row>
      </Card>
    </Pressable>
  );
}
