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
import { FlameIcon } from './StreakFlame';
import { CameraIcon } from './icons';

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
  photoDates,
  streakStart,
}: {
  entries: DailyEntryWithDrinks[];
  today: LocalDate;
  selected: LocalDate | null;
  onSelect: (date: LocalDate) => void;
  /** Dates carrying at least one photo; marked so memories are findable later. */
  photoDates?: ReadonlySet<string>;
  /** First day of the live streak: those days glow as a chain of flames. */
  streakStart?: LocalDate | null;
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
          {/* back to today: shown whenever you've wandered off it */}
          {(startOfMonth(anchor) !== startOfMonth(today) || selected !== today) && (
            <Pressable
              onPress={() => {
                setAnchor(today);
                onSelect(today);
              }}
              accessibilityRole="button"
              accessibilityLabel="Go to today"
              className="min-h-[44px] px-3 rounded-lg items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.accentBg }}
            >
              <Txt variant="label" style={{ color: colors.accent, fontFamily: 'Figtree_600SemiBold' }}>
                Today
              </Txt>
            </Pressable>
          )}
          <IconButton
            accessibilityLabel="Previous month"
            onPress={() => setAnchor(addDays(startOfMonth(anchor), -1))}
            className="rounded-lg"
          >
            <Txt variant="heading">‹</Txt>
          </IconButton>
          <IconButton
            accessibilityLabel="Next month"
            onPress={() => setAnchor(addDays(endOfMonth(anchor), 1))}
            className="rounded-lg"
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
          // part of the live streak: warm amber with a flame, so the chain
          // you're protecting is visible at a glance
          const inStreak =
            !!streakStart && !!info && info.status !== 'slip' && d >= streakStart && d <= today;
          const sc = inStreak
            ? { fg: colors.flameDeep, bg: colors.flameBg }
            : info
              ? statusColors[info.status]
              : null;
          return (
            <Pressable
              key={d}
              disabled={future}
              onPress={() => onSelect(d)}
              accessibilityLabel={`${d}${info ? `, ${info.status}` : ''}${
                photoDates?.has(d) ? ', has a photo' : ''
              }`}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}
            >
              <View
                // rounded square, not a circle: the corner markers have room
                className="flex-1 items-center justify-center"
                style={{
                  // `card` is now the same warm white as the enclosing Card, so
                  // unlogged cells need their own tint to read as tiles — kept
                  // light (canvas tone) so colored status days stay dominant
                  borderRadius: 10,
                  backgroundColor: sc ? sc.bg : colors.bg,
                  opacity: future ? 0.35 : 1,
                  borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                  borderColor: isSelected ? colors.accent : colors.borderStrong,
                }}
              >
                <Txt
                  variant="body"
                  className="text-sm"
                  style={{
                    color: sc ? sc.fg : colors.textMuted,
                    fontWeight: info ? '700' : '400',
                  }}
                >
                  {Number(d.slice(-2))}
                </Txt>
                {/*
                  A clear day earns a check; a logged day with drinks gets a dot.
                  Without this, a win was only a faint tint and read as "nothing
                  happened here".
                */}
                {inStreak ? (
                  <FlameIcon streak={5} size={11} />
                ) : info?.status === 'win' && !info.hasDrinks ? (
                  <Txt style={{ color: sc!.fg, fontSize: 9, lineHeight: 11, fontWeight: '700' }}>
                    ✓
                  </Txt>
                ) : info?.hasDrinks ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      marginTop: 2,
                      backgroundColor: sc ? sc.fg : colors.textFaint,
                    }}
                  />
                ) : null}
                {/*
                  Photo marker sits in the corner rather than under the number:
                  that slot already belongs to the ✓ / drink dot, and a day can
                  have both a status and a photo.
                */}
                {photoDates?.has(d) ? (
                  <View
                    style={{ position: 'absolute', top: 2, right: 2 }}
                    accessibilityElementsHidden
                  >
                    <CameraIcon color={colors.accent} size={11} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Row className="gap-4 mt-4 flex-wrap">
        {streakStart ? <Legend color={colors.flame} label="Current streak" /> : null}
        <Legend color={statusColors.win.fg} label="Win" />
        <Legend color={statusColors.slip.fg} label="Slip" />
        <Legend color={statusColors.freeze.fg} label="Frozen" />
        {photoDates && photoDates.size > 0 ? (
          <Row className="gap-1.5">
            <CameraIcon color={colors.accent} size={13} />
            <Txt variant="caption">Photo</Txt>
          </Row>
        ) : null}
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
