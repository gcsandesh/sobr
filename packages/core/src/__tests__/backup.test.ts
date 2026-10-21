import { describe, expect, it } from 'vitest';
import { buildBackup, entriesToRestore, parseBackup } from '../backup';
import { mkDrink, mkEntry } from './helpers';

const settings = { winMode: 'zero' as const, dailyLimitUnits: 2, currency: 'NPR', timeZone: 'Asia/Kathmandu' };

function sample() {
  return buildBackup(
    [
      { ...mkEntry('2026-10-02', 'slip', [mkDrink({ name: 'Beer', volumeMl: 330, abv: 5, quantity: 2, cost: 3 })]) },
      { ...mkEntry('2026-10-01', 'win'), note: 'Walked, "slept" well' },
    ],
    settings,
    '2026-10-21T10:00:00.000Z',
  );
}

describe('buildBackup / parseBackup', () => {
  it('round-trips through JSON, oldest day first, with drinks and notes', () => {
    const parsed = parseBackup(JSON.stringify(sample()));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.backup.entries.map((e) => e.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(parsed.backup.entries[0]!.note).toBe('Walked, "slept" well');
    expect(parsed.backup.entries[1]!.drinks[0]).toMatchObject({ name: 'Beer', quantity: 2, cost: 3 });
    expect(parsed.backup.settings.currency).toBe('NPR');
  });

  it('accepts a leading BOM', () => {
    expect(parseBackup('﻿' + JSON.stringify(sample())).ok).toBe(true);
  });

  it('rejects other files with a clear reason, never throwing', () => {
    expect(parseBackup('not json')).toMatchObject({ ok: false });
    expect(parseBackup('{"hello":1}')).toMatchObject({ ok: false, error: 'That file isn’t a sobr backup.' });
    expect(parseBackup(JSON.stringify({ ...sample(), version: 2 }))).toMatchObject({ ok: false });
  });

  it('rejects damaged data instead of half-importing', () => {
    const bad = sample();
    (bad.entries[0] as { status: string }).status = 'party';
    expect(parseBackup(JSON.stringify(bad)).ok).toBe(false);
    const dup = sample();
    dup.entries.push({ ...dup.entries[0]! });
    expect(parseBackup(JSON.stringify(dup))).toMatchObject({ ok: false });
  });
});

describe('entriesToRestore', () => {
  it('only restores days that are not already logged', () => {
    const b = sample();
    expect(entriesToRestore(b, new Set(['2026-10-02'])).map((e) => e.date)).toEqual(['2026-10-01']);
    expect(entriesToRestore(b, new Set())).toHaveLength(2);
  });
});
