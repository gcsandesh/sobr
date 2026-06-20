import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  DRINK_PRESETS,
  PRESET_GROUP_LABELS,
  currencyByCode,
  formatCurrency,
  type DrinkPreset,
} from '@sobr/config';
import {
  type DrinkInput,
  evaluateStatus,
  roundUnits,
  totalCost,
  totalUnits,
} from '@sobr/core';
import { PlusIcon } from '../../src/components/icons';
import { Button, Card, Row, Txt } from '../../src/components/ui';
import { useDayEntry, useDeleteDay, useSaveDay, useSettings } from '../../src/data/hooks';
import { colors } from '../../src/theme';

export default function DayLogger() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const day = String(date);
  const router = useRouter();

  const settings = useSettings();
  const entryQ = useDayEntry(day);
  const saveDay = useSaveDay();
  const deleteDay = useDeleteDay();

  const mode = settings.data?.winMode ?? 'zero';
  const limit = settings.data?.dailyLimitUnits ?? 2;
  const currency = settings.data?.currency ?? 'USD';

  const [drinks, setDrinks] = useState<DrinkInput[]>([]);
  const [manualStatus, setManualStatus] = useState<'win' | 'slip'>('win');
  const [showCustom, setShowCustom] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // hydrate local state from the saved entry once
  useEffect(() => {
    if (hydrated || entryQ.isLoading) return;
    const e = entryQ.data;
    if (e) {
      setDrinks(
        e.drinks.map((d) => ({
          presetKey: d.presetKey,
          name: d.name,
          volumeMl: d.volumeMl,
          abv: d.abv,
          cost: d.cost,
          quantity: d.quantity,
        })),
      );
      if (e.status === 'win' || e.status === 'slip') setManualStatus(e.status);
    }
    setHydrated(true);
  }, [hydrated, entryQ.isLoading, entryQ.data]);

  const evalResult = useMemo(
    () => evaluateStatus({ mode, drinks, manualStatus, dailyLimitUnits: limit }),
    [mode, drinks, manualStatus, limit],
  );
  const status = mode === 'manual' ? manualStatus : evalResult.status;

  function addPreset(p: DrinkPreset) {
    setDrinks((prev) => {
      const i = prev.findIndex((d) => d.presetKey === p.key);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i]!, quantity: next[i]!.quantity + 1 };
        return next;
      }
      return [
        ...prev,
        { presetKey: p.key, name: p.name, volumeMl: p.volumeMl, abv: p.abv, cost: null, quantity: 1 },
      ];
    });
  }

  function setQty(idx: number, delta: number) {
    setDrinks((prev) => {
      const next = [...prev];
      const item = next[idx]!;
      const q = item.quantity + delta;
      if (q <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...item, quantity: q };
      return next;
    });
  }

  function setCost(idx: number, value: string) {
    setDrinks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, cost: value === '' ? null : Number(value) };
      return next;
    });
  }

  async function save() {
    await saveDay.mutateAsync({ date: day, status, drinks });
    router.back();
  }

  async function clearDay() {
    if (entryQ.data) await deleteDay.mutateAsync(entryQ.data.id);
    router.back();
  }

  const units = roundUnits(totalUnits(drinks));
  const spent = totalCost(drinks);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ title: prettyDate(day), headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        {/* status banner */}
        <Card className={status === 'win' ? 'border-win' : 'border-slip'}>
          {mode === 'limit' ? (
            <>
              <Txt variant="label">{evalResult.withinLimit ? 'Within your limit' : 'Over your limit'}</Txt>
              <Txt variant="title" className={evalResult.withinLimit ? 'text-win' : 'text-slip'}>
                {units} / {limit} units
              </Txt>
            </>
          ) : mode === 'manual' ? (
            <>
              <Txt variant="label" className="mb-2">
                How would you call today?
              </Txt>
              <Row className="gap-2">
                <Button
                  label="Win"
                  tone={manualStatus === 'win' ? 'win' : 'secondary'}
                  className="flex-1"
                  onPress={() => setManualStatus('win')}
                />
                <Button
                  label="Slip"
                  tone={manualStatus === 'slip' ? 'danger' : 'secondary'}
                  className="flex-1"
                  onPress={() => setManualStatus('slip')}
                />
              </Row>
            </>
          ) : (
            <>
              <Txt variant="label">{drinks.length === 0 ? 'Clear day' : 'Logged'}</Txt>
              <Txt variant="title" className={status === 'win' ? 'text-win' : 'text-slip'}>
                {status === 'win' ? 'This counts as a win' : 'Logged — no streak today'}
              </Txt>
            </>
          )}
          <Txt variant="bodyMuted" className="mt-2">
            {units} units{spent > 0 ? ` · ${formatCurrency(spent, currency)}` : ''}
          </Txt>
        </Card>

        {/* line items */}
        {drinks.length > 0 && (
          <View className="mt-5 gap-2">
            {drinks.map((d, idx) => (
              <Card key={`${d.presetKey ?? 'custom'}-${idx}`} className="py-3">
                <Row className="justify-between">
                  <View className="flex-1 pr-2">
                    <Txt variant="body">{d.name}</Txt>
                    <Txt variant="caption">
                      {d.volumeMl}ml · {d.abv}%
                    </Txt>
                  </View>
                  <Row className="gap-3 items-center">
                    <Pressable
                      onPress={() => setQty(idx, -1)}
                      accessibilityLabel={`Remove one ${d.name}`}
                      className="w-9 h-9 rounded-full bg-surface-raised items-center justify-center"
                    >
                      <Txt variant="heading">−</Txt>
                    </Pressable>
                    <Txt variant="heading">{d.quantity}</Txt>
                    <Pressable
                      onPress={() => setQty(idx, 1)}
                      accessibilityLabel={`Add one ${d.name}`}
                      className="w-9 h-9 rounded-full bg-surface-raised items-center justify-center"
                    >
                      <Txt variant="heading">+</Txt>
                    </Pressable>
                  </Row>
                </Row>
                <Row className="mt-2 items-center gap-2">
                  <Txt variant="caption">{currencyByCode(currency).symbol}</Txt>
                  <TextInput
                    value={d.cost === null ? '' : String(d.cost)}
                    onChangeText={(v) => setCost(idx, v)}
                    keyboardType="decimal-pad"
                    placeholder="cost (optional)"
                    placeholderTextColor={colors.textFaint}
                    className="flex-1 text-text font-sans text-sm py-1"
                  />
                </Row>
              </Card>
            ))}
          </View>
        )}

        {/* preset picker */}
        <Txt variant="heading" className="mt-6 mb-3">
          Add to today
        </Txt>
        {(['beer', 'wine', 'spirits', 'local'] as const).map((group) => (
          <View key={group} className="mb-3">
            <Txt variant="label" className="mb-2">
              {PRESET_GROUP_LABELS[group]}
            </Txt>
            <View className="flex-row flex-wrap gap-2">
              {DRINK_PRESETS.filter((p) => p.group === group).map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => addPreset(p)}
                  accessibilityLabel={`Add ${p.name}`}
                  className="bg-surface border border-border rounded-full px-4 py-2 active:opacity-70"
                >
                  <Txt variant="body" className="text-sm">
                    {p.glyph ? `${p.glyph} ` : ''}
                    {p.name.split('—')[0]?.trim()}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => setShowCustom((s) => !s)}
          className="flex-row items-center gap-2 mt-1"
          accessibilityLabel="Add a custom item"
        >
          <PlusIcon color={colors.accent} />
          <Txt variant="body" className="text-accent">
            Add something custom
          </Txt>
        </Pressable>
        {showCustom && <CustomForm onAdd={(d) => setDrinks((prev) => [...prev, d])} />}
      </ScrollView>

      {/* sticky actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg border-t border-border px-5 pt-3 pb-8 gap-2">
        <Button label="Save today" onPress={save} loading={saveDay.isPending} />
        {entryQ.data && (
          <Button
            label="Remove this day"
            tone="ghost"
            onPress={clearDay}
            loading={deleteDay.isPending}
          />
        )}
      </View>
    </View>
  );
}

function CustomForm({ onAdd }: { onAdd: (d: DrinkInput) => void }) {
  const [name, setName] = useState('');
  const [volume, setVolume] = useState('');
  const [abv, setAbv] = useState('');
  const [cost, setCost] = useState('');

  const field = 'bg-surface border border-border rounded-lg px-3 py-3 text-text font-sans';
  return (
    <Card className="mt-3 gap-2">
      <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.textFaint} className={field} />
      <Row className="gap-2">
        <TextInput value={volume} onChangeText={setVolume} placeholder="ml" keyboardType="decimal-pad" placeholderTextColor={colors.textFaint} className={`${field} flex-1`} />
        <TextInput value={abv} onChangeText={setAbv} placeholder="ABV %" keyboardType="decimal-pad" placeholderTextColor={colors.textFaint} className={`${field} flex-1`} />
        <TextInput value={cost} onChangeText={setCost} placeholder="cost" keyboardType="decimal-pad" placeholderTextColor={colors.textFaint} className={`${field} flex-1`} />
      </Row>
      <Button
        label="Add"
        tone="secondary"
        onPress={() => {
          if (!name || !Number(volume) || abv === '') return;
          onAdd({
            presetKey: null,
            name,
            volumeMl: Number(volume),
            abv: Number(abv),
            cost: cost === '' ? null : Number(cost),
            quantity: 1,
          });
          setName('');
          setVolume('');
          setAbv('');
          setCost('');
        }}
      />
    </Card>
  );
}

function prettyDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
