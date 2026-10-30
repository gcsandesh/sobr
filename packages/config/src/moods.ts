/**
 * The five moods a day can be logged with, worst to best. `value` is what's
 * stored (daily_entries.mood); labels stay plain and non-clinical.
 */
export interface MoodOption {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  emoji: string;
}

export const MOODS: readonly MoodOption[] = [
  { value: 1, label: 'Rough', emoji: '😣' },
  { value: 2, label: 'Low', emoji: '🙁' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
];

export function moodOption(value: number | null | undefined): MoodOption | undefined {
  return MOODS.find((m) => m.value === value);
}
