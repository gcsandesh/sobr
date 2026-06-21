import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { growthMetaForKey } from '@sobr/config';
import { roundUnits, totalUnits } from '@sobr/core';
import { AnimatedNumber } from '../../src/components/AnimatedNumber';
import { Logo } from '../../src/components/Logo';
import { Tree } from '../../src/components/Tree';
import { SnowflakeIcon } from '../../src/components/icons';
import { Button, Card, Row, Screen, StatusPill, Txt } from '../../src/components/ui';
import { useDayEntry, useHomeStats, useSaveDay, useUseFreeze } from '../../src/data/hooks';
import { haptics } from '../../src/lib/haptics';
import { colors } from '../../src/theme';

export default function Today() {
  const router = useRouter();
  const stats = useHomeStats();
  const todayEntry = useDayEntry(stats.today);
  const saveDay = useSaveDay();
  const useFreeze = useUseFreeze();
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const entry = todayEntry.data;
  const meta = growthMetaForKey(stats.stage);
  const greeting = greetingForHour();

  function celebrateWin(message: string) {
    haptics.success();
    setCelebrate(message);
    setTimeout(() => setCelebrate(null), 2600);
  }

  if (stats.isLoading) return <LoadingHero />;

  return (
    <Screen scroll>
      {/* header */}
      <Row className="justify-between mt-2 mb-4">
        <View>
          <Txt variant="label">{greeting}</Txt>
          <Txt variant="title">Today</Txt>
        </View>
        <Row
          className="gap-1"
          accessibilityLabel={`${stats.bankedFreezes} of 3 freezes banked`}
        >
          {[0, 1, 2].map((i) => (
            <SnowflakeIcon
              key={i}
              color={i < stats.bankedFreezes ? colors.frozen : colors.border}
            />
          ))}
        </Row>
      </Row>

      {/* calm win moment */}
      {celebrate && (
        <Animated.View entering={FadeInDown.duration(360)} exiting={FadeOut} className="mb-3">
          <Card className="border-win items-center py-3">
            <Txt variant="body" className="text-win">
              {celebrate}
            </Txt>
          </Card>
        </Animated.View>
      )}

      {/* tree + streak */}
      <Animated.View entering={FadeIn.duration(500)}>
        <Card className="items-center pt-8 pb-6">
          <Tree stage={stats.stage} progress={stats.progress.progressToNext} size={210} />
          <AnimatedNumber value={stats.streak.current} variant="display" className="mt-2" />
          <Txt variant="label" className="-mt-1">
            day streak
          </Txt>
          <Txt variant="bodyMuted" className="mt-4 text-center px-2">
            {meta.label} · {meta.blurb}
          </Txt>
          {stats.progress.winDaysToNext !== null && (
            <Txt variant="caption" className="mt-2">
              {stats.progress.winDaysToNext} more clear{' '}
              {stats.progress.winDaysToNext === 1 ? 'day' : 'days'} to grow further
            </Txt>
          )}
          {stats.streak.longest > 0 && (
            <Txt variant="caption" className="mt-1">
              Longest · {stats.streak.longest}
            </Txt>
          )}
        </Card>
      </Animated.View>

      {/* today's check-in */}
      <Txt variant="heading" className="mt-6 mb-3">
        How was today?
      </Txt>

      {entry ? (
        <Card>
          <Row className="justify-between">
            <StatusPill status={entry.status} />
            <Txt variant="caption">{entry.drinks.length > 0 ? 'logged' : ''}</Txt>
          </Row>
          <Txt variant="body" className="mt-3">
            {entry.status === 'win'
              ? 'A clear win today. Nicely done.'
              : entry.status === 'freeze'
                ? 'Protected with a freeze — your streak stays safe.'
                : 'Logged. Tomorrow’s a fresh page.'}
          </Txt>
          {entry.drinks.length > 0 && (
            <Txt variant="bodyMuted" className="mt-1">
              {roundUnits(totalUnits(entry.drinks))} units logged
            </Txt>
          )}
          <Button
            label="Edit today"
            tone="secondary"
            className="mt-4"
            onPress={() => router.push(`/day/${stats.today}`)}
          />
          {entry.status === 'slip' && stats.bankedFreezes > 0 && (
            <Button
              label="Protect with a freeze"
              tone="win"
              className="mt-2"
              loading={useFreeze.isPending}
              onPress={() =>
                useFreeze.mutate(stats.today, {
                  onSuccess: () => celebrateWin('Streak protected. You’ve got this.'),
                })
              }
            />
          )}
        </Card>
      ) : (
        <View className="gap-3">
          <Button
            label="It was a clear day"
            tone="win"
            loading={saveDay.isPending}
            onPress={() =>
              saveDay.mutate(
                { date: stats.today, status: 'win', drinks: [] },
                { onSuccess: () => celebrateWin('A clear day — nicely done.') },
              )
            }
          />
          <Button
            label="Log today"
            tone="secondary"
            onPress={() => router.push(`/day/${stats.today}`)}
          />
        </View>
      )}
    </Screen>
  );
}

/** Calm first-load state — a gently pulsing logo rather than empty zeros. */
function LoadingHero() {
  const pulse = useSharedValue(0.6);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Animated.View style={style}>
          <Logo size={72} />
        </Animated.View>
        <Txt variant="bodyMuted" className="mt-5">
          A moment…
        </Txt>
      </View>
    </Screen>
  );
}

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
