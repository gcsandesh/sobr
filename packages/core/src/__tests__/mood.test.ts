import { describe, expect, it } from 'vitest';
import { moodByDayType } from '../mood';

describe('moodByDayType', () => {
  it('averages mood separately for clear days (win + freeze) and slips', () => {
    const split = moodByDayType([
      { status: 'win', mood: 4 },
      { status: 'freeze', mood: 5 },
      { status: 'slip', mood: 2 },
      { status: 'slip', mood: 3 },
    ]);
    expect(split.clear).toEqual({ avg: 4.5, days: 2 });
    expect(split.slip).toEqual({ avg: 2.5, days: 2 });
  });

  it('ignores days without a mood and returns null averages when empty', () => {
    const split = moodByDayType([{ status: 'win', mood: null }, { status: 'slip' }]);
    expect(split.clear).toEqual({ avg: null, days: 0 });
    expect(split.slip).toEqual({ avg: null, days: 0 });
  });

  it('rounds to one decimal', () => {
    const split = moodByDayType([
      { status: 'win', mood: 4 },
      { status: 'win', mood: 4 },
      { status: 'win', mood: 5 },
    ]);
    expect(split.clear.avg).toBe(4.3);
  });
});
