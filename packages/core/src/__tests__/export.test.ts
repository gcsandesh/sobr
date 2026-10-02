import { describe, expect, it } from 'vitest';
import { entriesToCsv } from '../export';
import { mkDrink, mkEntry } from './helpers';

const lines = (csv: string) => csv.split('\r\n');

describe('entriesToCsv', () => {
  it('writes only the header for no entries', () => {
    expect(entriesToCsv([])).toBe('date,status,units,drinks,cost,note\r\n');
  });

  it('puts the currency in the cost header when given', () => {
    expect(lines(entriesToCsv([], 'NPR'))[0]).toBe('date,status,units,drinks,cost (NPR),note');
  });

  it('sorts rows oldest first regardless of input order', () => {
    const csv = entriesToCsv([mkEntry('2026-09-03', 'win'), mkEntry('2026-09-01', 'win')]);
    expect(lines(csv)[1]!.startsWith('2026-09-01')).toBe(true);
    expect(lines(csv)[2]!.startsWith('2026-09-03')).toBe(true);
  });

  it('summarises drinks, rounds units, and totals cost', () => {
    const e = mkEntry('2026-09-06', 'slip', [
      mkDrink({ name: 'Beer — strong', volumeMl: 500, abv: 6.5, cost: 600, quantity: 2 }),
    ]);
    // 500 * 6.5 / 1000 * 2 = 6.5 units; 600 * 2 = 1200
    expect(lines(entriesToCsv([e]))[1]).toBe('2026-09-06,slip,6.5,2× Beer — strong,1200,');
  });

  it('rounds cost to cents so float drift never reaches the file', () => {
    // 0.1 * 3 is 0.30000000000000004 in floating point
    const e = mkEntry('2026-09-07', 'slip', [mkDrink({ cost: 0.1, quantity: 3 })]);
    expect(lines(entriesToCsv([e]))[1]!.split(',')[4]).toBe('0.3');
  });

  it('quotes fields containing commas, quotes or newlines, doubling inner quotes', () => {
    const e = { ...mkEntry('2026-09-08', 'win'), note: 'Said "no thanks", then\nwent home' };
    // one logical row, even though it spans two physical lines
    expect(entriesToCsv([e])).toBe(
      'date,status,units,drinks,cost,note\r\n' +
        '2026-09-08,win,0,,0,"Said ""no thanks"", then\nwent home"\r\n',
    );
  });

  it('joins several drinks with a semicolon, so the drinks column stays one field', () => {
    const e = mkEntry('2026-09-09', 'slip', [
      mkDrink({ name: 'Wine', quantity: 1 }),
      mkDrink({ name: 'Raksi', quantity: 2 }),
    ]);
    expect(lines(entriesToCsv([e]))[1]!.split(',')[3]).toBe('1× Wine; 2× Raksi');
  });
});
