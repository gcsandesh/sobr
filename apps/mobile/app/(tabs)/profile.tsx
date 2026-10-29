import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GROWTH_STAGES } from '@sobr/config';
import { BookIcon, HomeLeafIcon, SnowflakeIcon } from '../../src/components/icons';
import { FlameIcon } from '../../src/components/StreakFlame';
import { ForestScene } from '../../src/components/ForestScene';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { Tree } from '../../src/components/Tree';
import {
  Card,
  ListRow,
  Row,
  RowValue,
  Screen,
  SectionHeader,
  Txt,
} from '../../src/components/ui';
import { useSession } from '../../src/data/SessionProvider';
import { useHomeStats } from '../../src/data/hooks';
import { colors, stageHues } from '../../src/theme';
import { useRefresh } from '../../src/data/useRefresh';

/**
 * The user's own page: who they are, the numbers that matter, and the growth
 * journey so far. Celebratory, never clinical — this is the trophy room.
 */
export default function Profile() {
  const refresh = useRefresh();
  const router = useRouter();
  const { email, session, greetingName } = useSession();
  const stats = useHomeStats();

  const memberSince = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Screen edges={['top']} scroll refreshControl={refresh}>
      {/* identity */}
      <View className="items-center mt-6 mb-8">
        <ProfilePhoto size={88} />
        <Txt variant="title" className="mt-4">
          {greetingName ?? 'You'}
        </Txt>
        {/* omit entirely when there's nothing to say — a lone em-dash reads as a bug */}
        {(email || memberSince) && (
          <Txt variant="caption" className="mt-1">
            {email ?? ''}
            {email && memberSince ? ' · ' : ''}
            {memberSince ? `growing since ${memberSince}` : ''}
          </Txt>
        )}
        <Pressable
          onPress={() => router.push('/account')}
          accessibilityRole="button"
          className="mt-3 px-4 py-2 rounded-lg active:opacity-70"
          style={{ backgroundColor: colors.accentBg }}
        >
          <Txt variant="label" style={{ color: colors.accent, fontFamily: 'Figtree_600SemiBold' }}>
            Edit profile
          </Txt>
        </Pressable>
      </View>

      {/* stats grid */}
      <SectionHeader title="Your numbers" />
      <View className="flex-row flex-wrap gap-3 mb-6">
        <StatCard
          icon={<FlameIcon streak={stats.streak.current} size={22} />}
          value={String(stats.streak.current)}
          label="Current streak"
          color={stats.streak.current > 0 ? colors.flameDeep : colors.textFaint}
        />
        <StatCard
          icon={<FlameIcon streak={Math.max(1, stats.streak.longest)} size={22} />}
          value={String(stats.streak.longest)}
          label="Best streak"
          color={colors.flameDeep}
        />
        <StatCard
          icon={<HomeLeafIcon color={colors.win} size={22} />}
          value={String(stats.lifetimeWins)}
          label="Clear days, all time"
          color={colors.win}
        />
        <StatCard
          icon={<SnowflakeIcon color={colors.frozen} size={20} />}
          value={`${stats.bankedFreezes}/3`}
          label="Freezes banked"
          color={colors.frozen}
        />
      </View>

      {/* growth journey */}
      <SectionHeader
        title="This tree's journey"
        caption={`${stats.streak.current}-day streak`}
      />
      <Card className="mb-6">
        {GROWTH_STAGES.map((stage, i) => {
          // the tree follows the current streak: a slip starts a new one.
          // Each stage has its own hue, warm earth to dusk violet.
          const hue = stageHues[stage.key];
          const achieved = stats.streak.current >= stage.minWinDays;
          const isCurrent = stage.key === stats.stage;
          const isLast = i === GROWTH_STAGES.length - 1;
          return (
            // deliberately NOT a vertically-centered Row: the dot column has to
            // stretch to the row's height, or a fixed-height connector falls
            // short of the next dot whenever a row wraps
            <View key={stage.key} className="flex-row">
              <View className="items-center mr-3" style={{ width: 28 }}>
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: achieved ? hue.solid : colors.bg,
                    borderWidth: achieved ? 0 : 2,
                    borderColor: isCurrent ? hue.solid : colors.border,
                  }}
                >
                  {achieved && (
                    <Txt className="text-white text-xs font-bold" variant="caption">
                      ✓
                    </Txt>
                  )}
                </View>
                {!isLast && (
                  <View
                    style={{
                      flex: 1,
                      width: 3,
                      marginVertical: 3,
                      borderRadius: 2,
                      backgroundColor:
                        stats.streak.current >= GROWTH_STAGES[i + 1]!.minWinDays
                          ? hue.solid
                          : colors.border,
                    }}
                  />
                )}
              </View>
              <View
                className={`flex-1 flex-row items-center rounded-xl px-3 py-2 ${isLast ? '' : 'mb-2'}`}
                style={isCurrent ? { backgroundColor: hue.bg } : undefined}
              >
                <View className="flex-1">
                  <Txt
                    variant="body"
                    className={achieved ? 'font-semibold' : 'text-text-muted'}
                    style={achieved ? { color: hue.fg } : undefined}
                  >
                    {stage.label}
                    {isCurrent ? '  ·  you are here' : ''}
                  </Txt>
                  <Txt variant="caption" className="mt-0.5">
                    {stage.minWinDays === 0 ? 'Day one' : `${stage.minWinDays} days in a row`}
                  </Txt>
                </View>
                <View style={{ opacity: achieved ? 1 : 0.35 }}>
                  <Tree stage={stage.key} progress={1} size={40} />
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      {/* the forest: trees from finished streaks */}
      <SectionHeader
        title="Your forest"
        caption={stats.forest.length ? `${stats.forest.length} planted` : undefined}
      />
      <Card className="mb-6">
        <ForestScene trees={stats.forest} />
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
              streak, and your tree, safe.
            </Txt>
          </View>
        </Row>
      </Card>

      {/* read back */}
      <Card>
        <ListRow
          icon={<BookIcon color={colors.accent} />}
          title="History & notes"
          subtitle="Every day you’ve checked in, newest first"
          right={<RowValue />}
          onPress={() => router.push('/history')}
        />
      </Card>

      <Txt variant="caption" className="text-center mt-6 mb-2">
        sobr · Clear days, counted.
      </Txt>
    </Screen>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Card className="flex-1 min-w-[45%] py-4">
      <Row className="gap-1.5">
        {icon}
        <Txt variant="displaySm" style={{ color }}>
          {value}
        </Txt>
      </Row>
      <Txt variant="label" className="mt-1">
        {label}
      </Txt>
    </Card>
  );
}
