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
import { type LocalDate, roundUnits, totalUnits } from '@sobr/core';
import { AnimatedNumber } from '../../src/components/AnimatedNumber';
import { Logo } from '../../src/components/Logo';
import { Glow } from '../../src/components/Glow';
import { GrowthCelebration } from '../../src/components/GrowthCelebration';
import { MonthCalendar } from '../../src/components/MonthCalendar';
import { Tree } from '../../src/components/Tree';
import { SnowflakeIcon } from '../../src/components/icons';
import { Button, Card, Notice, Row, Screen, StatusPill, Txt } from '../../src/components/ui';
import {
  useAllEntries,
  useDayEntry,
  useHomeStats,
  useSaveDay,
  useUseFreeze,
} from '../../src/data/hooks';
import { useGrowthCelebration } from '../../src/data/useGrowthCelebration';
import { haptics } from '../../src/lib/haptics';
import { colors } from '../../src/theme';

export default function Today() {
  const router = useRouter();
  const stats = useHomeStats();
  const entriesQ = useAllEntries();
  const saveDay = useSaveDay();
  const useFreeze = useUseFreeze();
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<LocalDate | null>(null);
  const growth = useGrowthCelebration(
    stats.progress.stageIndex,
    stats.stage,
    !stats.isLoading && !stats.isError,
  );

  const meta = growthMetaForKey(stats.stage);
  const greeting = greetingForHour();
  const activeDate = selectedDate ?? stats.today;
  const dayEntry = useDayEntry(activeDate);

  function celebrateWin(message: string) {
    haptics.success();
    setCelebrate(message);
    setTimeout(() => setCelebrate(null), 2600);
  }

  if (stats.isLoading) return <LoadingHero />;

  if (stats.isError) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <Notice
            tone="error"
            title="Couldn’t reach your data"
            message="Check your connection and try again — your progress is safe."
            onRetry={stats.refetch}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {growth.celebration && (
        <GrowthCelebration meta={growth.celebration} onDismiss={growth.dismiss} />
      )}

      {/* header */}
      <Row className="justify-between mt-2 mb-4">
        <View>
          <Txt variant="label">{greeting}</Txt>
          <Txt variant="title">sobr</Txt>
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
          <View className="absolute top-2 items-center justify-center" pointerEvents="none">
            <Glow size={300} />
          </View>
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

      {/* embedded calendar */}
      <Txt variant="heading" className="mt-6 mb-3">
        Your days
      </Txt>
      <Card>
        {entriesQ.isError ? (
          <Notice
            tone="error"
            title="Couldn’t load your calendar"
            message="Pull to retry once you’re back online."
            onRetry={() => entriesQ.refetch()}
          />
        ) : (
          <MonthCalendar
            entries={entriesQ.data ?? []}
            today={stats.today}
            selected={activeDate}
            onSelect={setSelectedDate}
          />
        )}
      </Card>

      {/* day detail — the selected date's check-in, right below the calendar */}
      <Txt variant="heading" className="mt-6 mb-3">
        {dateHeading(activeDate, stats.today)}
      </Txt>
      {dayEntry.data ? (
        <Card>
          <Row className="justify-between">
            <StatusPill status={dayEntry.data.status} />
            <Txt variant="caption">{dayEntry.data.drinks.length > 0 ? 'logged' : ''}</Txt>
          </Row>
          <Txt variant="body" className="mt-3">
            {dayEntry.data.status === 'win'
              ? 'A clear win. Nicely done.'
              : dayEntry.data.status === 'freeze'
                ? 'Protected with a freeze — the streak stayed safe.'
                : 'Logged — a fresh page follows.'}
          </Txt>
          {dayEntry.data.drinks.length > 0 && (
            <Txt variant="bodyMuted" className="mt-1">
              {roundUnits(totalUnits(dayEntry.data.drinks))} units logged
            </Txt>
          )}
          <Button
            label="Edit this day"
            tone="secondary"
            className="mt-4"
            onPress={() => router.push(`/day/${activeDate}`)}
          />
          {activeDate === stats.today && dayEntry.data.status === 'slip' && stats.bankedFreezes > 0 && (
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
          {activeDate === stats.today ? (
            <>
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
                onPress={() => router.push(`/day/${activeDate}`)}
              />
            </>
          ) : (
            <Button
              label="Log this day"
              tone="secondary"
              onPress={() => router.push(`/day/${activeDate}`)}
            />
          )}
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

function dateHeading(date: LocalDate, today: LocalDate): string {
  if (date === today) return 'How was today?';
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const label = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return label;
}
