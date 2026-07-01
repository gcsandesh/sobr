import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  addDays,
  type DailyEntryWithDrinks,
  endOfMonth,
  enumerateDates,
  isAfter,
  type LocalDate,
  startOfMonth,
  totalUnits,
} from '@sobr/core';
import { IconButton, Row, Txt } from './ui';
import { colors, statusColors } from '../theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * A month-grid calendar, extracted so it can be embedded on Home (with an
 * inline day-detail panel) instead of living on its own tab. Color-coded by
 * status, future days disabled, the selected day gets its own ring so it
 * reads distinctly from "today".
 */
export function MonthCalendar({
  entries,
  today,
  selected,
  onSelect,
}: {
  entries: DailyEntryWithDrinks[];
  today: LocalDate;
  selected: LocalDate | null;
  onSelect: (date: LocalDate) => void;
}) {
  const [anchor, setAnchor] = useState<LocalDate>(today);

  const byDate = useMemo(() => {
    const m = new Map<string, { status: 'win' | 'slip' | 'freeze'; hasDrinks: boolean }>();
    for (const e of entries) {
      m.set(e.entryDate, { status: e.status, hasDrinks: totalUnits(e.drinks) > 0 });
    }
    return m;
  }, [entries]);

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const days = enumerateDates(monthStart, monthEnd);
  const leadPad = weekdayOf(monthStart);

  const monthLabel = new Date(`${monthStart}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <View>
      <Row className="justify-between mb-3">
        <Txt variant="heading">{monthLabel}</Txt>
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
          const isSelected = d === selected;
          const sc = info ? statusColors[info.status] : null;
          return (
            <Pressable
              key={d}
              disabled={future}
              onPress={() => onSelect(d)}
              accessibilityLabel={`${d}${info ? `, ${info.status}` : ''}`}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}
            >
              <View
                className="flex-1 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: sc ? sc.bg : colors.card,
                  opacity: future ? 0.35 : 1,
                  borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                  borderColor: isSelected ? colors.accent : colors.borderStrong,
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

      <Row className="gap-4 mt-4 flex-wrap">
        <Legend color={statusColors.win.fg} label="Win" />
        <Legend color={statusColors.slip.fg} label="Slip" />
        <Legend color={statusColors.freeze.fg} label="Frozen" />
      </Row>
    </View>
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
