import type { DrinkInput, EntryStatus, WinMode } from './schemas';
import { totalUnits } from './units';

/**
 * Win-condition evaluation. Returns 'win' | 'slip' only — 'freeze' is a separate,
 * user-initiated protection applied to a slip, never auto-derived here.
 *
 *  - zero   : any logged drink ⇒ slip, otherwise win.
 *  - limit  : total units ≤ daily limit ⇒ win, otherwise slip (no drinks ⇒ win).
 *  - manual : the user's explicit declaration, independent of what's logged.
 */

const EPSILON = 1e-9; // guard the limit boundary against float dust (e.g. 1.65 + 0.35)

export type DeterminedStatus = Extract<EntryStatus, 'win' | 'slip'>;

export interface StatusInput {
  mode: WinMode;
  drinks: ReadonlyArray<Pick<DrinkInput, 'volumeMl' | 'abv' | 'quantity'>>;
  /** Required in manual mode; ignored otherwise. */
  manualStatus?: DeterminedStatus;
  /** Required in limit mode; ignored otherwise. */
  dailyLimitUnits?: number;
}

export function determineStatus(input: StatusInput): DeterminedStatus {
  const { mode, drinks } = input;
  switch (mode) {
    case 'zero':
      return drinks.length > 0 ? 'slip' : 'win';
    case 'limit': {
      const limit = input.dailyLimitUnits ?? 0;
      return totalUnits(drinks) <= limit + EPSILON ? 'win' : 'slip';
    }
    case 'manual':
      // User decides. Default to 'win' if they haven't chosen yet (e.g. empty day).
      return input.manualStatus ?? 'win';
  }
}

/** Richer evaluation for the live logger UI (the "X / limit units" readout). */
export interface StatusEvaluation {
  status: DeterminedStatus;
  totalUnits: number;
  limit: number | null;
  /** limit mode only: units over the limit (0 when within). */
  overBy: number;
  withinLimit: boolean;
  /** True when the mode auto-derives status (zero/limit) vs. user-set (manual). */
  isAutomatic: boolean;
}

export function evaluateStatus(input: StatusInput): StatusEvaluation {
  const units = totalUnits(input.drinks);
  const status = determineStatus(input);

  if (input.mode === 'limit') {
    const limit = input.dailyLimitUnits ?? 0;
    const overBy = Math.max(0, units - limit);
    return {
      status,
      totalUnits: units,
      limit,
      overBy,
      withinLimit: units <= limit + EPSILON,
      isAutomatic: true,
    };
  }

  return {
    status,
    totalUnits: units,
    limit: null,
    overBy: 0,
    withinLimit: input.mode === 'zero' ? input.drinks.length === 0 : true,
    isAutomatic: input.mode === 'zero',
  };
}
