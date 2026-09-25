import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  DRINK_PRESETS,
  PRESET_GROUP_LABELS,
  growthMetaForKey,
  presetChipLabel,
  type DrinkPreset,
} from '@sobr/config';
import { type LocalDate, evaluateStatus, roundUnits, totalUnits } from '@sobr/core';
import { AnimatedNumber } from '../../src/components/AnimatedNumber';
import { BottomSheet } from '../../src/components/BottomSheet';
import { Logo } from '../../src/components/Logo';
import { Glow } from '../../src/components/Glow';
import { GrowthCelebration } from '../../src/components/GrowthCelebration';
import { MilestoneCelebration } from '../../src/components/MilestoneCelebration';
import { MonthCalendar } from '../../src/components/MonthCalendar';
import { Tree } from '../../src/components/Tree';
import { ChevronRightIcon, PlusIcon, SnowflakeIcon, SparkIcon } from '../../src/components/icons';
import { Button, Card, Notice, Row, Screen, StatusPill, Txt } from '../../src/components/ui';
import {
  useAllEntries,
  useDayEntry,
  useHomeStats,
  useSaveDay,
  useSettings,
  usePhotoDates,
  useUseFreeze,
} from '../../src/data/hooks';
import { useGrowthCelebration } from '../../src/data/useGrowthCelebration';
import { useMilestoneCelebration } from '../../src/data/useMilestoneCelebration';
import { useDailyPledge } from '../../src/data/useDailyPledge';
import { haptics } from '../../src/lib/haptics';
import { formatDay } from '../../src/lib/dates';
import { useSession } from '../../src/data/SessionProvider';
import { colors } from '../../src/theme';
import { useRefresh } from '../../src/data/useRefresh';

/**
 * The hero card's own mini-palette: a deep teal dusk. Deliberately darker than
 * anything else in the (otherwise cool-mist) app — one dominant surface that
 * carries the brand, per the frontend-design direction. Cool off-white text
 * (Fraunces numeral) clears WCAG AA against the deep teal.
 */
const HERO = {
  bgTop: '#2E9D95', // luminous teal at the top…
  bgMid: '#1F6F6B',
  bg: '#14504D', // …deepening to pine, so white text stays ≥4.5:1 lower down
  text: '#F4FAF8',
  textMuted: 'rgba(255,249,240,0.86)',
  textFaint: 'rgba(255,249,240,0.68)',
  track: 'rgba(255,249,240,0.22)',
  fill: '#A8E3DB',
} as const;

export default function Today() {
  const refresh = useRefresh();
  const router = useRouter();
  const { displayName } = useSession();
  const stats = useHomeStats();
  const entriesQ = useAllEntries();
  const settings = useSettings();
  const saveDay = useSaveDay();
  const useFreeze = useUseFreeze();
  const photoDatesQ = usePhotoDates();
  const photoDates = useMemo(() => new Set(photoDatesQ.data ?? []), [photoDatesQ.data]);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<LocalDate | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const growth = useGrowthCelebration(
    stats.progress.stageIndex,
    stats.stage,
    !stats.isLoading && !stats.isError,
  );
  const milestone = useMilestoneCelebration(stats.lifetimeWins, !stats.isLoading && !stats.isError);

  const meta = growthMetaForKey(stats.stage);
  // only a name the user chose; an email-derived guess is too presumptuous here
  const greeting = displayName
    ? `${greetingForHour()}, ${displayName.split(' ')[0]}`
    : greetingForHour();
  const pledge = useDailyPledge(stats.today);
  const isEvening = new Date().getHours() >= 17;
  const activeDate = selectedDate ?? stats.today;
  const dayEntry = useDayEntry(activeDate);
  const todayEntry = useDayEntry(stats.today);

  function celebrateWin(message: string) {
    haptics.success();
    setCelebrate(message);
    setTimeout(() => setCelebrate(null), 2600);
  }

  /** FAB shortcut: add one preset to today without leaving Home. */
  function quickAdd(preset: DrinkPreset) {
    const existing = (todayEntry.data?.drinks ?? []).map((d) => ({
      presetKey: d.presetKey,
      name: d.name,
      volumeMl: d.volumeMl,
      abv: d.abv,
      cost: d.cost,
      quantity: d.quantity,
    }));
    const idx = existing.findIndex((d) => d.presetKey === preset.key);
    const drinks =
      idx >= 0
        ? existing.map((d, i) => (i === idx ? { ...d, quantity: d.quantity + 1 } : d))
        : [
            ...existing,
            {
              presetKey: preset.key,
              name: preset.name,
              volumeMl: preset.volumeMl,
              abv: preset.abv,
              cost: null,
              quantity: 1,
            },
          ];
    const mode = settings.data?.winMode ?? 'zero';
    const limit = settings.data?.dailyLimitUnits ?? 2;
    const status =
      mode === 'manual'
        ? todayEntry.data?.status === 'win'
          ? 'win'
          : 'slip'
        : evaluateStatus({ mode, drinks, manualStatus: 'slip', dailyLimitUnits: limit }).status;
    saveDay.mutate({ date: stats.today, status, drinks });
    setQuickAddOpen(false);
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
    <>
      <Screen
        scroll
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {growth.celebration && (
          <GrowthCelebration meta={growth.celebration} onDismiss={growth.dismiss} />
        )}
        {!growth.celebration && milestone.celebration && (
          <MilestoneCelebration milestone={milestone.celebration} onDismiss={milestone.dismiss} />
        )}

        {/* header — the greeting IS the headline: personal, editorial */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <Row className="justify-between mt-2 mb-4">
            <View className="flex-1 pr-3">
              <Txt variant="caption">sobr</Txt>
              <Txt variant="title" numberOfLines={1} adjustsFontSizeToFit>
                {greeting}
              </Txt>
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
        </Animated.View>

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

        {/*
        Hero — the app's one bold moment: a deep forest card at dusk. The rest of
        the app stays white and quiet so this single dominant surface carries the
        identity: glowing tree, oversized warm-white streak numeral, moss accents.
      */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <View
            className="items-center pt-5 pb-5 px-5 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: HERO.bg,
              shadowColor: HERO.bg,
              shadowOpacity: 0.35,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={[HERO.bgTop, HERO.bgMid, HERO.bg]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View className="absolute top-0 items-center justify-center" pointerEvents="none">
              <Glow size={340} color="#8FD9CF" opacity={0.42} />
            </View>
            <Tree stage={stats.stage} progress={stats.progress.progressToNext} size={176} />
            <AnimatedNumber
              value={stats.streak.current}
              variant="display"
              className="mt-2"
              style={{ color: HERO.text }}
            />
            <Txt variant="label" className="-mt-1" style={{ color: HERO.textMuted }}>
              day streak
            </Txt>
            <Txt
              variant="bodyMuted"
              className="mt-3 text-center px-2"
              style={{ color: HERO.textMuted }}
            >
              {meta.label} · {meta.blurb}
            </Txt>

            {/* progress to the next stage */}
            {stats.progress.winDaysToNext !== null && (
              <View className="w-full mt-5 px-2">
                <View
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: HERO.track }}
                  accessibilityLabel={`${Math.round(stats.progress.progressToNext * 100)}% to the next stage`}
                >
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(4, stats.progress.progressToNext * 100)}%`,
                      backgroundColor: HERO.fill,
                    }}
                  />
                </View>
                <Txt
                  variant="caption"
                  className="mt-2 text-center"
                  style={{ color: HERO.textFaint }}
                >
                  {stats.progress.winDaysToNext} more clear{' '}
                  {stats.progress.winDaysToNext === 1 ? 'day' : 'days'} to grow further
                </Txt>
              </View>
            )}
          </View>
        </Animated.View>

        {/* stat pills */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Row className="gap-3 mt-3">
            <StatPill value={String(stats.lifetimeWins)} label="clear days" />
            <StatPill value={String(stats.streak.longest)} label="longest" />
            <StatPill value={`${stats.bankedFreezes}/3`} label="freezes" />
          </Row>
        </Animated.View>

        {/* daily ritual — morning pledge, evening reflection. Local, gentle, optional. */}
        {pledge.pledged !== null && (
          <Animated.View entering={FadeInDown.delay(180).duration(500)}>
            {!isEvening && !pledge.pledged && (
              <Card className="mt-3">
                <Txt variant="label" className="text-accent">
                  Today’s intention
                </Txt>
                <Txt variant="body" className="mt-1">
                  Start the day with a quiet promise to yourself.
                </Txt>
                <Button
                  label="Today, I choose a clear day"
                  tone="secondary"
                  className="mt-3"
                  onPress={() => {
                    haptics.select();
                    pledge.takePledge();
                  }}
                />
              </Card>
            )}
            {!isEvening && pledge.pledged && (
              <Card className="mt-3 flex-row items-center">
                <Txt variant="body" className="text-win">
                  ✓
                </Txt>
                <Txt variant="bodyMuted" className="ml-2 flex-1">
                  Intention set for today. See you tonight.
                </Txt>
              </Card>
            )}
            {isEvening && !todayEntry.data && (
              <Card className="mt-3">
                <Txt variant="label" className="text-accent">
                  Evening check-in
                </Txt>
                <Txt variant="body" className="mt-1">
                  {pledge.pledged
                    ? 'You set an intention this morning — how did the day go?'
                    : 'How did today go? A minute to reflect keeps the picture honest.'}
                </Txt>
                <Button
                  label="Log today"
                  tone="secondary"
                  className="mt-3"
                  onPress={() => router.push(`/day/${stats.today}`)}
                />
              </Card>
            )}
          </Animated.View>
        )}

        {/* steady — the urge toolbox, always one tap away */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable
            onPress={() => router.push('/steady')}
            accessibilityRole="button"
            accessibilityLabel="Open Steady, a guided breathing exercise"
            className="active:opacity-80"
          >
            <Card className="mt-3 flex-row items-center">
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 40, height: 40, backgroundColor: colors.accentBg }}
              >
                <SparkIcon color={colors.accent} size={22} />
              </View>
              <View className="flex-1 ml-3">
                <Txt variant="body">Craving something?</Txt>
                <Txt variant="caption" className="mt-0.5">
                  Steady — a minute of slow breathing
                </Txt>
              </View>
              <ChevronRightIcon color={colors.textFaint} />
            </Card>
          </Pressable>
        </Animated.View>

        {/* embedded calendar */}
        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
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
                photoDates={photoDates}
              />
            )}
          </Card>
        </Animated.View>

        {/* day detail — the selected date's check-in, right below the calendar */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)}>
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
              {dayEntry.data.note?.trim() ? (
                <View className="mt-3 rounded-xl bg-surface-raised px-3 py-2.5">
                  <Txt variant="caption" className="mb-0.5">
                    Reflection
                  </Txt>
                  <Txt variant="body" className="text-sm" numberOfLines={4}>
                    {dayEntry.data.note.trim()}
                  </Txt>
                </View>
              ) : null}
              <Button
                label="Edit this day"
                tone="secondary"
                className="mt-4"
                onPress={() => router.push(`/day/${activeDate}`)}
              />
              {activeDate === stats.today &&
                dayEntry.data.status === 'slip' &&
                stats.bankedFreezes > 0 && (
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
        </Animated.View>

        {/* clearance so the floating quick-add never covers the last card */}
        <View className="h-16" />
      </Screen>

      {/* floating quick-add, matching the prototype's FAB pattern */}
      <Pressable
        onPress={() => setQuickAddOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Add a drink"
        className="absolute items-center justify-center active:opacity-85"
        style={{
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent,
          shadowColor: '#16211F',
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <PlusIcon color="#F4FAF8" size={24} />
      </Pressable>

      <BottomSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Add a drink · Today"
      >
        {(['beer', 'wine', 'spirits', 'local'] as const).map((group) => (
          <View key={group} className="mb-4">
            <Txt variant="label" className="mb-2">
              {PRESET_GROUP_LABELS[group]}
            </Txt>
            <View className="flex-row flex-wrap gap-2">
              {DRINK_PRESETS.filter((p) => p.group === group).map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => quickAdd(p)}
                  accessibilityLabel={`Add ${p.name}`}
                  className="bg-surface border border-border rounded-full px-4 min-h-[44px] justify-center active:opacity-70"
                >
                  <Txt variant="body" className="text-sm">
                    {p.glyph ? `${p.glyph} ` : ''}
                    {presetChipLabel(p.name)}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Button
          label="Custom amount, or edit today"
          tone="ghost"
          onPress={() => {
            setQuickAddOpen(false);
            router.push(`/day/${stats.today}`);
          }}
        />
      </BottomSheet>
    </>
  );
}

/** A compact stat on a soft card — the row under the hero. */
/**
 * The numeral's color is set via `style`, not a class: the `heading` variant
 * hardcodes `text-text`, which wins over a caller's `text-accent`.
 */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <Card
      className="flex-1 items-center py-3 px-2"
      style={{ backgroundColor: colors.accentBg, borderColor: '#BFDED8' }}
    >
      <Txt variant="heading" style={{ color: colors.accent }}>
        {value}
      </Txt>
      <Txt variant="caption" className="mt-0.5">
        {label}
      </Txt>
    </Card>
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
  return formatDay(date, 'long');
}
