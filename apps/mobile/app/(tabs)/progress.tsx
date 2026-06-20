import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { formatCurrency } from '@sobr/config';
import { addDays, roundUnits, todayInTz, totalUnits } from '@sobr/core';
import { Card, Row, Screen, Txt } from '../../src/components/ui';
import { useAllEntries, useHomeStats, useSettings, useTimeZone } from '../../src/data/hooks';
import { colors } from '../../src/theme';

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

  return (
    <Screen scroll>
      <Txt variant="title" className="mt-2 mb-5">
        Progress
      </Txt>

      <Card>
        <Txt variant="label" className="mb-3">
          Last 14 days · units
        </Txt>
        <UnitsBars data={last14} />
      </Card>

      <Txt variant="heading" className="mt-6 mb-3">
        This month
      </Txt>
      <View className="flex-row flex-wrap gap-3">
        <Stat label="Clear wins" value={String(m.wins)} />
        <Stat label="Units" value={String(roundUnits(m.totalUnits))} />
        <Stat label="Spent" value={formatCurrency(m.totalSpent, currency)} />
        <Stat
          label="Avg units / day out"
          value={String(roundUnits(m.avgUnitsPerDrinkingDay))}
        />
      </View>

      <Txt variant="heading" className="mt-6 mb-3">
        All time
      </Txt>
      <View className="flex-row flex-wrap gap-3">
        <Stat label="Longest streak" value={String(a.longestStreak)} accent />
        <Stat label="Total clear days" value={String(a.totalWinDays)} accent />
        <Stat label="Total units" value={String(roundUnits(a.totalUnits))} />
        <Stat label="Total spent" value={formatCurrency(a.totalSpent, currency)} />
      </View>
    </Screen>
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
  const H = 90;
  const gap = 4;
  const barW = (W - gap * (data.length - 1)) / data.length;
  const max = Math.max(1, ...data.map((d) => d.units));
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {data.map((d, i) => {
        const h = (d.units / max) * (H - 8);
        return (
          <Rect
            key={d.date}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={Math.max(2, h)}
            rx={3}
            fill={d.units === 0 ? colors.border : colors.accent}
          />
        );
      })}
    </Svg>
  );
}
