import { useMemo, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { roundUnits, totalUnits, type DailyEntryWithDrinks } from '@sobr/core';
import { BookIcon, ChevronRightIcon } from '../src/components/icons';
import {
  CONTENT_MAX_WIDTH,
  Chip,
  EmptyState,
  Notice,
  Row,
  StatusPill,
  Txt,
} from '../src/components/ui';
import { useAllEntries, usePhotoDates } from '../src/data/hooks';
import { formatDay, formatMonth } from '../src/lib/dates';
import { colors } from '../src/theme';

type Filter = 'all' | 'win' | 'slip' | 'notes';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All days' },
  { key: 'win', label: 'Clear' },
  { key: 'slip', label: 'Slips' },
  { key: 'notes', label: 'With notes' },
];

/**
 * Every logged day, newest first, grouped by month. The calendar is better for
 * patterns; this is better for reading back: notes are shown inline, so it
 * doubles as the reflection journal.
 */
export default function History() {
  const router = useRouter();
  const entriesQ = useAllEntries();
  const photoDatesQ = usePhotoDates();
  const [filter, setFilter] = useState<Filter>('all');

  const sections = useMemo(() => {
    const photoDates = new Set(photoDatesQ.data ?? []);
    const list = [...(entriesQ.data ?? [])]
      .filter((e) => {
        if (filter === 'win') return e.status === 'win' || e.status === 'freeze';
        if (filter === 'slip') return e.status === 'slip';
        if (filter === 'notes') return !!e.note?.trim();
        return true;
      })
      .sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
    const byMonth = new Map<string, (DailyEntryWithDrinks & { hasPhoto: boolean })[]>();
    for (const e of list) {
      const key = e.entryDate.slice(0, 7);
      const bucket = byMonth.get(key) ?? [];
      bucket.push({ ...e, hasPhoto: photoDates.has(e.entryDate) });
      byMonth.set(key, bucket);
    }
    return [...byMonth.entries()].map(([key, data]) => ({
      title: formatMonth(`${key}-01`),
      clear: data.filter((d) => d.status !== 'slip').length,
      data,
    }));
  }, [entriesQ.data, photoDatesQ.data, filter]);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ title: 'History' }} />
      {entriesQ.isError ? (
        <View className="p-5">
          <Notice
            tone="error"
            title="Couldn’t load your days"
            message="Check your connection and try again."
            onRetry={() => entriesQ.refetch()}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 48,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: 'center',
          }}
          ListHeaderComponent={
            <View className="flex-row flex-wrap gap-2 mb-2">
              {FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  selected={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Row className="justify-between items-baseline mt-5 mb-2">
              <Txt variant="heading">{section.title}</Txt>
              <Txt variant="caption">
                {section.clear} of {section.data.length} clear
              </Txt>
            </Row>
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/day/${item.entryDate}`)}
              accessibilityRole="button"
              accessibilityLabel={`${formatDay(item.entryDate, 'long')}, ${item.status}. Open this day`}
              className="rounded-2xl border border-border bg-surface px-4 py-3 active:opacity-80"
            >
              <Row className="gap-3">
                <View className="flex-1">
                  <Row className="gap-2">
                    <Txt variant="body" className="font-semibold">
                      {formatDay(item.entryDate)}
                    </Txt>
                    {item.hasPhoto ? (
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colors.accent }}
                        accessibilityLabel="has photos"
                      />
                    ) : null}
                  </Row>
                  {item.note?.trim() ? (
                    <Txt variant="bodyMuted" className="text-sm mt-1" numberOfLines={2}>
                      {item.note.trim()}
                    </Txt>
                  ) : item.drinks.length > 0 ? (
                    <Txt variant="caption" className="mt-1">
                      {roundUnits(totalUnits(item.drinks))} units
                    </Txt>
                  ) : null}
                </View>
                <StatusPill status={item.status} />
                <ChevronRightIcon color={colors.textFaint} size={18} />
              </Row>
            </Pressable>
          )}
          ListEmptyComponent={
            entriesQ.isLoading ? null : (
              <View className="mt-4">
                <EmptyState
                  icon={<BookIcon color={colors.accent} />}
                  title={filter === 'all' ? 'Nothing here yet' : 'No days match'}
                  message={
                    filter === 'all'
                      ? 'Days you check in will collect here, with any notes you write.'
                      : 'Try another filter.'
                  }
                />
              </View>
            )
          }
        />
      )}
    </View>
  );
}
