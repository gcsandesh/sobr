import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { formatCurrency } from '@sobr/config';
import { addDays, milestoneProgress, nextMilestone, roundUnits, todayInTz, totalUnits } from '@sobr/core';
import { BookIcon, ChartIcon } from '../../src/components/icons';
import {
  Card,
  EmptyState,
  ListRow,
  Notice,
  Row,
  RowValue,
  Screen,
  SectionHeader,
  Txt,
} from '../../src/components/ui';
import { useAllEntries, useHomeStats, useSettings, useTimeZone } from '../../src/data/hooks';
import { colors, milestoneHues, spectrum, type SpectrumColor } from '../../src/theme';
import { useRefresh } from '../../src/data/useRefresh';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Progress() {
  const refresh = useRefresh();
  const router = useRouter();
  const stats = useHomeStats();
  const settings = useSettings();
  const tz = useTimeZone();
  const entriesQ = useAllEntries();
  const currency = settings.data?.currency ?? 'USD';

  const last14 = useMemo(() => {
    const today = todayInTz(tz);
    const map = new Map<string, number>();
    for (const e of entriesQ.data ?? []) map.set(e.entryDate, totalUnits(e.drinks));
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, -(13 - i));
      return { date: d, units: map.get(d) ?? 0 };
    });
  }, [entriesQ.data, tz]);

  const m = stats.monthly;
  const a = stats.allTime;
  const winRate = m.wins > 0 || m.totalUnits > 0 ? Math.round((m.wins / 30) * 100) : 0;
  const isEmpty = !stats.isError && !stats.isLoading && !stats.hasAnyData;

  return (
    <Screen edges={['top']} scroll refreshControl={refresh}>
      <Txt variant="title" className="mt-2 mb-6">
        Progress
      </Txt>

      {stats.isError && (
        <View className="mb-4">
          <Notice
            tone="error"
            title="Couldn’t load your stats"
            message="Check your connection and try again."
            onRetry={stats.refetch}
          />
        </View>
      )}

      {/*
        With no data at all, a single empty state reads far better than three
        sections of zeros — so the stats only mount once there's something to
        show. Milestones stay visible either way: they're the road ahead.
      */}
      {isEmpty ? (
        <EmptyState
          title="Your story starts soon"
          message="Log a few days and your progress will grow here — clear days, units, and spend."
          icon={<ChartIcon color={colors.accent} size={26} />}
        />
      ) : (
        <>
          <SectionHeader title="Last 14 days" caption="units logged" />
          <Card className="mb-6">
            <UnitsBars data={last14} />
          </Card>

          <SectionHeader title="This month" caption={`~${Math.min(100, winRate)}% clear`} />
          <View className="flex-row flex-wrap gap-3 mb-6">
            <Stat label="Clear wins" value={String(m.wins)} hue={spectrum.lime} />
            <Stat label="Units" value={String(roundUnits(m.totalUnits))} hue={spectrum.sky} />
            <Stat label="Spent" value={formatCurrency(m.totalSpent, currency)} hue={spectrum.amber} />
            <Stat
              label="Avg units / day out"
              value={String(roundUnits(m.avgUnitsPerDrinkingDay))}
              hue={spectrum.violet}
            />
          </View>

          <SectionHeader title="All time" />
          <View className="flex-row flex-wrap gap-3 mb-6">
            <Stat label="Longest streak" value={String(a.longestStreak)} hue={spectrum.rose} />
            <Stat label="Total clear days" value={String(a.totalWinDays)} hue={spectrum.teal} />
            <Stat label="Total units" value={String(roundUnits(a.totalUnits))} hue={spectrum.indigo} />
            <Stat label="Total spent" value={formatCurrency(a.totalSpent, currency)} hue={spectrum.amber} />
          </View>
        </>
      )}

      {!isEmpty && (
        <Card className="mb-6">
          <ListRow
            icon={<BookIcon color={colors.accent} />}
            title="History & notes"
            subtitle="Read back every day, with your reflections"
            right={<RowValue />}
            onPress={() => router.push('/history')}
          />
        </Card>
      )}

      <View className={isEmpty ? 'mt-6' : ''}>
        <Milestones totalWinDays={stats.lifetimeWins} />
      </View>
    </Screen>
  );
}

/**
 * Milestones are based on TOTAL clear days, not the streak — a slip never
 * takes one away. Reached ones glow; the next one shows how close it is.
 */
function Milestones({ totalWinDays }: { totalWinDays: number }) {
  const items = milestoneProgress(totalWinDays);
  const next = nextMilestone(totalWinDays);
  return (
    <>
      <SectionHeader
        title="Milestones"
        caption={
          next
            ? `${next.days - totalWinDays} to go`
            : 'all reached'
        }
      />
      <Card>
        {items.map(({ milestone, reached }, i) => {
          // each milestone has its own hue along the spectrum, so the road
          // reads as a journey rather than one long green list
          const hue = milestoneHues[i % milestoneHues.length]!;
          const isNext = !reached && milestone.days === next?.days;
          const isLast = i === items.length - 1;
          return (
            <View key={milestone.days} className="flex-row">
              <View className="items-center mr-3" style={{ width: 40 }}>
                <View
                  className="items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: reached ? hue.solid : isNext ? hue.bg : colors.bg,
                    borderWidth: isNext ? 2 : reached ? 0 : 1,
                    borderColor: isNext ? hue.solid : colors.border,
                  }}
                >
                  <Txt
                    variant="caption"
                    style={{
                      color: reached ? '#FFFFFF' : isNext ? hue.fg : colors.textFaint,
                      fontFamily: 'Figtree_700Bold',
                      fontSize: milestone.days >= 100 ? 11 : 13,
                    }}
                  >
                    {milestone.days}
                  </Txt>
                </View>
                {!isLast && (
                  <View
                    style={{
                      flex: 1,
                      minHeight: 10,
                      width: 2,
                      marginVertical: 3,
                      borderRadius: 1,
                      backgroundColor: reached ? hue.solid : colors.border,
                      opacity: reached ? 0.45 : 1,
                    }}
                  />
                )}
              </View>
              <View className={`flex-1 pt-2 ${isLast ? '' : 'pb-3'}`}>
                <Row className="justify-between">
                  <Txt
                    variant="body"
                    className={reached || isNext ? 'font-semibold' : 'text-text-muted'}
                    style={isNext ? { color: hue.fg } : undefined}
                  >
                    {milestone.label}
                  </Txt>
                  {reached ? (
                    <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: hue.bg }}>
                      <Txt variant="caption" style={{ color: hue.fg, fontFamily: 'Figtree_600SemiBold' }}>
                        reached
                      </Txt>
                    </View>
                  ) : isNext ? (
                    <Txt variant="caption" style={{ color: hue.fg, fontFamily: 'Figtree_600SemiBold' }}>
                      next
                    </Txt>
                  ) : null}
                </Row>
                {(reached || isNext) && (
                  <Txt variant="caption" className="mt-0.5">
                    {milestone.blurb}
                  </Txt>
                )}
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function Stat({ label, value, hue }: { label: string; value: string; hue: SpectrumColor }) {
  return (
    <Card className="flex-1 min-w-[45%]">
      {/* a thin hue bar on top tells the cards apart at a glance */}
      <View
        style={{
          width: 28,
          height: 4,
          borderRadius: 2,
          backgroundColor: hue.solid,
          marginBottom: 10,
        }}
      />
      <Txt variant="displaySm" style={{ color: hue.fg }}>
        {value}
      </Txt>
      <Txt variant="label" className="mt-1">
        {label}
      </Txt>
    </Card>
  );
}

function UnitsBars({ data }: { data: { date: string; units: number }[] }) {
  const W = 300;
  const H = 96;
  const gap = 5;
  const barW = (W - gap * (data.length - 1)) / data.length;
  const max = Math.max(1, ...data.map((d) => d.units));

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="unitsBar" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={spectrum.sky.solid} stopOpacity={1} />
            <Stop offset="1" stopColor={spectrum.indigo.solid} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        {/* baseline: without it, a run of clear days renders as blank space */}
        <Rect x={0} y={H - 1.5} width={W} height={1.5} rx={0.75} fill={colors.border} />
        {data.map((d, i) => {
          const h = (d.units / max) * (H - 10);
          const isZero = d.units === 0;
          return (
            <Rect
              key={d.date}
              x={i * (barW + gap)}
              y={H - Math.max(isZero ? 4 : 3, h)}
              width={barW}
              height={Math.max(isZero ? 4 : 3, h)}
              rx={barW / 2.4}
              // a clear day is a *good* day — show it as a small green tick,
              // never as an absence
              fill={isZero ? spectrum.lime.solid : 'url(#unitsBar)'}
              opacity={isZero ? 0.55 : 1}
            />
          );
        })}
      </Svg>
      <Row className="mt-1">
        {data.map((d) => (
          <View key={d.date} style={{ width: `${100 / data.length}%` }}>
            <Txt variant="caption" className="text-center">
              {WEEKDAY_INITIALS[weekdayOf(d.date)]}
            </Txt>
          </View>
        ))}
      </Row>
    </View>
  );
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
