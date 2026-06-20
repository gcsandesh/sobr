import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { growthMetaForKey } from '@sobr/config';
import { roundUnits, totalUnits } from '@sobr/core';
import { Tree } from '../../src/components/Tree';
import { SnowflakeIcon } from '../../src/components/icons';
import { Button, Card, Row, Screen, StatusPill, Txt } from '../../src/components/ui';
import { useDayEntry, useHomeStats, useSaveDay, useUseFreeze } from '../../src/data/hooks';
import { colors } from '../../src/theme';

export default function Today() {
  const router = useRouter();
  const stats = useHomeStats();
  const todayEntry = useDayEntry(stats.today);
  const saveDay = useSaveDay();
  const useFreeze = useUseFreeze();

  const entry = todayEntry.data;
  const meta = growthMetaForKey(stats.stage);
  const greeting = greetingForHour();

  return (
    <Screen scroll>
      {/* header */}
      <Row className="justify-between mt-2 mb-4">
        <View>
          <Txt variant="label">{greeting}</Txt>
          <Txt variant="title">Today</Txt>
        </View>
        <Row className="gap-1">
          {[0, 1, 2].map((i) => (
            <SnowflakeIcon
              key={i}
              color={i < stats.bankedFreezes ? colors.frozen : colors.border}
            />
          ))}
        </Row>
      </Row>

      {/* tree + streak */}
      <Card className="items-center pt-8 pb-6">
        <Tree stage={stats.stage} progress={stats.progress.progressToNext} size={210} />
        <Txt variant="display" className="mt-2">
          {stats.streak.current}
        </Txt>
        <Txt variant="label" className="-mt-1">
          {stats.streak.current === 1 ? 'day streak' : 'day streak'}
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
      </Card>

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
              onPress={() => useFreeze.mutate(stats.today)}
            />
          )}
        </Card>
      ) : (
        <View className="gap-3">
          <Button
            label="It was a clear day"
            tone="win"
            loading={saveDay.isPending}
            onPress={() => saveDay.mutate({ date: stats.today, status: 'win', drinks: [] })}
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

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
