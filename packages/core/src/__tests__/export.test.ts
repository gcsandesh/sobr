import { describe, expect, it } from 'vitest';
import { csvCell, entriesToCsv } from '../export';
import { mkDrink, mkEntry } from './helpers';

describe('csvCell', () => {
  it('leaves plain values alone', () => {
    expect(csvCell('win')).toBe('win');
    expect(csvCell(2.5)).toBe('2.5');
    expect(csvCell(null)).toBe('');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('neutralises formula injection in text, not in numbers', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell(-3)).toBe('-3');
  });
});

describe('entriesToCsv', () => {
  it('writes a header and one row per day, oldest first', () => {
    const csv = entriesToCsv([
      mkEntry('2026-09-02', 'slip', [
        mkDrink({ name: 'Beer', volumeMl: 330, abv: 5, quantity: 2, cost: 3 }),
        mkDrink({ name: 'Raksi', volumeMl: 60, abv: 40, cost: null }),
      ]),
      { ...mkEntry('2026-09-01', 'win'), note: 'Walked, slept well' },
    ]);
    const lines = csv.trimEnd().split('\r\n');
    expect(lines[0]).toBe('date,status,units,spent,items,note');
    expect(lines[1]).toBe('2026-09-01,win,0,,,"Walked, slept well"');
    // 2 × 330ml × 5% = 3.3u, + 60ml × 40% = 2.4u → 5.7u; spend 2 × 3 = 6
    expect(lines[2]).toBe('2026-09-02,slip,5.7,6,2× Beer; Raksi,');
    expect(lines).toHaveLength(3);
  });

  it('is just a header for no data', () => {
    expect(entriesToCsv([])).toBe('date,status,units,spent,items,note\r\n');
  });
});
