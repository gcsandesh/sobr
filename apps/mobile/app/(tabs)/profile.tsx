import { View } from 'react-native';
import { GROWTH_STAGES } from '@sobr/config';
import { SnowflakeIcon, LogOutIcon } from '../../src/components/icons';
import {
  Avatar,
  Card,
  ListRow,
  Row,
  Screen,
  SectionHeader,
  Txt,
} from '../../src/components/ui';
import { useSession } from '../../src/data/SessionProvider';
import { useHomeStats } from '../../src/data/hooks';
import { colors } from '../../src/theme';

/**
 * The user's own page: who they are, the numbers that matter, and the growth
 * journey so far. Celebratory, never clinical — this is the trophy room.
 */
export default function Profile() {
  const { email, session, signOut } = useSession();
  const stats = useHomeStats();

  const memberSince = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Screen scroll>
      {/* identity */}
      <View className="items-center mt-6 mb-8">
        <Avatar name={email} size={84} />
        <Txt variant="title" className="mt-4">
          {displayName(email)}
        </Txt>
        <Txt variant="caption" className="mt-1">
          {email ?? '—'}
          {memberSince ? ` · growing since ${memberSince}` : ''}
        </Txt>
      </View>

      {/* stats grid */}
      <SectionHeader title="Your numbers" />
      <View className="flex-row flex-wrap gap-3 mb-6">
        <StatCard value={String(stats.streak.current)} label="Current streak" />
        <StatCard value={String(stats.streak.longest)} label="Longest streak" />
        <StatCard value={String(stats.lifetimeWins)} label="Clear days" />
        <StatCard value={`${stats.bankedFreezes} / 3`} label="Freezes banked" />
      </View>

      {/* growth journey */}
      <SectionHeader title="Growth journey" caption={`${stats.lifetimeWins} clear days`} />
      <Card className="gap-0.5 mb-6">
        {GROWTH_STAGES.map((stage, i) => {
          const achieved = stats.lifetimeWins >= stage.minWinDays;
          const isCurrent = stage.key === stats.stage;
          return (
            <Row key={stage.key} className="py-2.5">
              {/* track dot */}
              <View className="items-center mr-3" style={{ width: 24 }}>
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: achieved ? colors.accent : colors.card,
                    borderWidth: achieved ? 0 : 2,
                    borderColor: colors.border,
                  }}
                >
                  {achieved && (
                    <Txt className="text-white text-xs font-bold" variant="caption">
                      ✓
                    </Txt>
                  )}
                </View>
                {i < GROWTH_STAGES.length - 1 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 26,
                      width: 2,
                      height: 22,
                      backgroundColor: achieved ? colors.accent : colors.border,
                    }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Txt variant="body" className={isCurrent ? 'text-accent font-semibold' : ''}>
                  {stage.label}
                  {isCurrent ? '  ·  you are here' : ''}
                </Txt>
                <Txt variant="caption">
                  {stage.minWinDays === 0 ? 'Day one' : `${stage.minWinDays} clear days`}
                </Txt>
              </View>
            </Row>
          );
        })}
      </Card>

      {/* freezes explainer */}
      <Card className="mb-6">
        <Row className="gap-3">
          <View className="w-10 h-10 rounded-xl items-center justify-center bg-frozen-bg">
            <SnowflakeIcon color={colors.frozen} />
          </View>
          <View className="flex-1">
            <Txt variant="body">Streak freezes</Txt>
            <Txt variant="caption" className="mt-0.5">
              Every 7-day streak banks a freeze (max 3). On a harder day, a freeze keeps your
              streak safe.
            </Txt>
          </View>
        </Row>
      </Card>

      {/* account actions */}
      <Card>
        <ListRow
          icon={<LogOutIcon color={colors.textMuted} />}
          title="Sign out"
          onPress={() => void signOut()}
        />
      </Card>

      <Txt variant="caption" className="text-center mt-6 mb-2">
        sobr · Clear days, counted.
      </Txt>
    </Screen>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex-1 min-w-[45%] py-4">
      <Txt variant="displaySm" className="text-accent">
        {value}
      </Txt>
      <Txt variant="label" className="mt-1">
        {label}
      </Txt>
    </Card>
  );
}

/** A friendly display name from the email's local part ("jane.doe" → "Jane Doe"). */
function displayName(email: string | null): string {
  if (!email) return 'You';
  const local = email.split('@')[0] ?? '';
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return 'You';
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
}
