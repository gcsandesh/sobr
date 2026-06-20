/**
 * Growth-stage *display* metadata. The numeric thresholds + stage resolution live
 * in @sobr/core (pure, tested). This file only describes how each stage looks/reads,
 * keyed by the same stage keys, so copy + visuals stay in one place.
 *
 * The tree is anchored to LIFETIME win days, not streak length — so a single slip
 * never visibly regresses long-term progress. Copy is gentle and encouraging.
 */

import { palette } from './tokens.js';

export type GrowthStageKey =
  | 'seed'
  | 'sprout'
  | 'sapling'
  | 'young_tree'
  | 'tree'
  | 'grove';

export type GrowthStageMeta = {
  key: GrowthStageKey;
  /** Win-days at which this stage begins (mirrors @sobr/core thresholds). */
  minWinDays: number;
  label: string;
  /** Short, warm, non-judgmental blurb shown near the tree. */
  blurb: string;
  /** Accent used for foliage tint at this stage. */
  foliage: string;
};

export const GROWTH_STAGES: GrowthStageMeta[] = [
  {
    key: 'seed',
    minWinDays: 0,
    label: 'Seed',
    blurb: 'Every forest starts here. Plant your first win.',
    foliage: palette.accent,
  },
  {
    key: 'sprout',
    minWinDays: 3,
    label: 'Sprout',
    blurb: 'First green showing. You’ve begun.',
    foliage: '#A6CE8C',
  },
  {
    key: 'sapling',
    minWinDays: 7,
    label: 'Sapling',
    blurb: 'Taking root. A week of good days behind you.',
    foliage: '#97C77E',
  },
  {
    key: 'young_tree',
    minWinDays: 14,
    label: 'Young tree',
    blurb: 'Standing on your own. Branches forming.',
    foliage: palette.win,
  },
  {
    key: 'tree',
    minWinDays: 30,
    label: 'Full tree',
    blurb: 'Strong and settled. A month-plus of wins.',
    foliage: '#7FB46E',
  },
  {
    key: 'grove',
    minWinDays: 60,
    label: 'Grove',
    blurb: 'One tree became many. This is who you are now.',
    foliage: '#74AA64',
  },
];

export function growthMetaForKey(key: GrowthStageKey): GrowthStageMeta {
  return GROWTH_STAGES.find((s) => s.key === key) ?? GROWTH_STAGES[0]!;
}
