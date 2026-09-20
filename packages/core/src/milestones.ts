/**
 * Milestones — named markers for lifetime clear days. Deliberately based on
 * TOTAL win days (non-consecutive), not the streak: a slip never takes a
 * reached milestone away, keeping progress visibly non-punitive.
 */

export interface Milestone {
  /** Clear days required. */
  days: number;
  label: string;
  blurb: string;
}

export const MILESTONES: readonly Milestone[] = [
  { days: 1, label: 'First clear day', blurb: 'Every path starts with a single day.' },
  { days: 3, label: 'Three days', blurb: 'A habit begins to take root.' },
  { days: 7, label: 'One week', blurb: 'Seven clear days — sleep and mornings start to change.' },
  { days: 14, label: 'Two weeks', blurb: 'Your body is thanking you already.' },
  { days: 30, label: 'One month', blurb: 'Thirty clear days. This is real momentum.' },
  { days: 60, label: 'Two months', blurb: 'What was effort is becoming rhythm.' },
  { days: 90, label: 'Three months', blurb: 'A full season of clearer days.' },
  { days: 180, label: 'Half a year', blurb: 'Quietly remarkable. Look how far you’ve come.' },
  { days: 365, label: 'One year', blurb: 'A year of clear days, counted. Extraordinary.' },
] as const;

export interface MilestoneProgress {
  milestone: Milestone;
  reached: boolean;
}

/** Every milestone with its reached state, given lifetime clear days. */
export function milestoneProgress(totalWinDays: number): MilestoneProgress[] {
  return MILESTONES.map((m) => ({ milestone: m, reached: totalWinDays >= m.days }));
}

/** The highest milestone reached, or null if none yet. */
export function highestMilestone(totalWinDays: number): Milestone | null {
  let best: Milestone | null = null;
  for (const m of MILESTONES) if (totalWinDays >= m.days) best = m;
  return best;
}

/** The next milestone ahead, or null once all are reached. */
export function nextMilestone(totalWinDays: number): Milestone | null {
  return MILESTONES.find((m) => totalWinDays < m.days) ?? null;
}
