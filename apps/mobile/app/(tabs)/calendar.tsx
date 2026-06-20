import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  addDays,
  endOfMonth,
  enumerateDates,
  isAfter,
  type LocalDate,
  startOfMonth,
  todayInTz,
  totalUnits,
} from '@sobr/core';
import { IconButton, Row, Screen, Txt } from '../../src/components/ui';
import { useAllEntries, useTimeZone } from '../../src/data/hooks';
import { colors, statusColors } from '../../src/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Calendar() {
  const router = useRouter();
  const tz = useTimeZone();
  const today = todayInTz(tz);
  const entriesQ = useAllEntries();

  const [anchor, setAnchor] = useState<LocalDate>(today);

  const byDate = useMemo(() => {
    const m = new Map<string, { status: 'win' | 'slip' | 'freeze'; hasDrinks: boolean }>();
    for (const e of entriesQ.data ?? []) {
      m.set(e.entryDate, { status: e.status, hasDrinks: totalUnits(e.drinks) > 0 });
    }
    return m;
  }, [entriesQ.data]);

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const days = enumerateDates(monthStart, monthEnd);
  const leadPad = weekdayOf(monthStart); // 0..6 (Sun..Sat)

  const monthLabel = new Date(`${monthStart}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <Screen scroll>
      <Row className="justify-between mt-2 mb-5">
        <Txt variant="title">Calendar</Txt>
        <Row className="gap-2">
          <IconButton
            accessibilityLabel="Previous month"
            onPress={() => setAnchor(addDays(startOfMonth(anchor), -1))}
            className="bg-surface"
          >
            <Txt variant="heading">‹</Txt>
          </IconButton>
          <IconButton
            accessibilityLabel="Next month"
            onPress={() => setAnchor(addDays(endOfMonth(anchor), 1))}
            className="bg-surface"
          >
            <Txt variant="heading">›</Txt>
          </IconButton>
        </Row>
      </Row>

      <Txt variant="heading" className="mb-3">
        {monthLabel}
      </Txt>

      <Row className="mb-2">
        {WEEKDAYS.map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Txt variant="caption">{d}</Txt>
          </View>
        ))}
      </Row>

      <View className="flex-row flex-wrap">
        {Array.from({ length: leadPad }).map((_, i) => (
          <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
        ))}
        {days.map((d) => {
          const info = byDate.get(d);
          const future = isAfter(d, today);
          const isToday = d === today;
          const sc = info ? statusColors[info.status] : null;
          return (
            <Pressable
              key={d}
              disabled={future}
              onPress={() => router.push(`/day/${d}`)}
              accessibilityLabel={`${d}${info ? `, ${info.status}` : ''}`}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}
            >
              <View
                className="flex-1 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: sc ? sc.bg : colors.card,
                  opacity: future ? 0.35 : 1,
                  borderWidth: isToday ? 1.5 : 0,
                  borderColor: colors.accent,
                }}
              >
                <Txt
                  variant="body"
                  className="text-sm"
                  style={{ color: sc ? sc.fg : colors.textMuted }}
                >
                  {Number(d.slice(-2))}
                </Txt>
                {info?.hasDrinks && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      marginTop: 2,
                      backgroundColor: sc ? sc.fg : colors.textFaint,
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Row className="gap-4 mt-6 flex-wrap">
        <Legend color={statusColors.win.fg} label="Win" />
        <Legend color={statusColors.slip.fg} label="Slip" />
        <Legend color={statusColors.freeze.fg} label="Frozen" />
      </Row>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row className="gap-2">
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Txt variant="caption">{label}</Txt>
    </Row>
  );
}

function weekdayOf(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
