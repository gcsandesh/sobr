import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { formatCurrency } from '@sobr/config';
import { addDays, milestoneProgress, nextMilestone, roundUnits, todayInTz, totalUnits } from '@sobr/core';
import { ChartIcon } from '../../src/components/icons';
import {
  Card,
  EmptyState,
  Notice,
  Row,
  Screen,
  SectionHeader,
  Txt,
} from '../../src/components/ui';
import { useAllEntries, useHomeStats, useSettings, useTimeZone } from '../../src/data/hooks';
import { colors } from '../../src/theme';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Progress() {
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
    <Screen scroll>
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
            <Stat label="Clear wins" value={String(m.wins)} />
            <Stat label="Units" value={String(roundUnits(m.totalUnits))} />
            <Stat label="Spent" value={formatCurrency(m.totalSpent, currency)} />
            <Stat label="Avg units / day out" value={String(roundUnits(m.avgUnitsPerDrinkingDay))} />
          </View>

          <SectionHeader title="All time" />
          <View className="flex-row flex-wrap gap-3 mb-6">
            <Stat label="Longest streak" value={String(a.longestStreak)} accent />
            <Stat label="Total clear days" value={String(a.totalWinDays)} accent />
            <Stat label="Total units" value={String(roundUnits(a.totalUnits))} />
            <Stat label="Total spent" value={formatCurrency(a.totalSpent, currency)} />
          </View>
        </>
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
            ? `${next.days - totalWinDays} clear ${next.days - totalWinDays === 1 ? 'day' : 'days'} to ${next.label.toLowerCase()}`
            : 'all reached'
        }
      />
      <Card>
        {items.map(({ milestone, reached }, i) => {
          // the next unreached milestone gets an accent ring — a flat beige list
          // gives no sense of where you are on the road
          const isNext = !reached && milestone.days === next?.days;
          return (
            <Row key={milestone.days} className={`items-center ${i > 0 ? 'mt-3' : ''}`}>
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: reached
                    ? colors.accent
                    : isNext
                      ? colors.accentBg
                      : colors.border,
                  borderWidth: isNext ? 2 : 0,
                  borderColor: colors.accent,
                }}
              >
                <Txt
                  variant="caption"
                  style={{
                    color: reached ? '#F4FAF8' : isNext ? colors.accent : colors.textMuted,
                    fontWeight: '700',
                  }}
                >
                  {milestone.days}
                </Txt>
              </View>
              <View className="flex-1 ml-3">
                <Txt
                  variant="body"
                  className={reached ? '' : isNext ? 'font-semibold' : 'text-text-muted'}
                  style={isNext ? { color: colors.accent } : undefined}
                >
                  {milestone.label}
                </Txt>
                {(reached || isNext) && (
                  <Txt variant="caption" className="mt-0.5">
                    {milestone.blurb}
                  </Txt>
                )}
              </View>
              {reached ? (
                <Txt variant="caption" className="text-accent">
                  reached
                </Txt>
              ) : isNext ? (
                <Txt variant="caption" style={{ color: colors.accent }}>
                  next
                </Txt>
              ) : null}
            </Row>
          );
        })}
      </Card>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="flex-1 min-w-[45%]">
      <Txt variant="displaySm" className={accent ? 'text-accent' : ''}>
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
            <Stop offset="0" stopColor={colors.accentBright} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0.85} />
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
              fill={isZero ? colors.win : 'url(#unitsBar)'}
              opacity={isZero ? 0.35 : 1}
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
