/**
 * Drink presets — quick-add common drinks with typical volume (ml) + ABV (%).
 * `abv` is a percentage number (e.g. 5 means 5%). Units derive in @sobr/core:
 *   units = volume_ml * abv / 1000 * quantity
 *
 * Includes Nepal-local options (raksi, tongba, local lager) for the primary user.
 */

export type DrinkPreset = {
  /** Stable key persisted on the drink row (null for fully custom entries). */
  key: string;
  name: string;
  volumeMl: number;
  abv: number;
  /** Grouping for the picker sheet. */
  group: 'beer' | 'wine' | 'spirits' | 'local' | 'other';
  /** Short emoji/glyph hint for the picker (purely decorative). */
  glyph?: string;
};

export const DRINK_PRESETS: DrinkPreset[] = [
  // Keys are persisted on drink rows: never rename or reuse one. Add new keys.

  // Beer
  { key: 'beer_regular', name: 'Beer — bottle', volumeMl: 330, abv: 5, group: 'beer', glyph: '🍺' },
  { key: 'beer_can_500', name: 'Beer — can', volumeMl: 500, abv: 5, group: 'beer', glyph: '🍺' },
  { key: 'beer_large_650', name: 'Beer — large bottle', volumeMl: 650, abv: 5, group: 'beer', glyph: '🍺' },
  { key: 'beer_pint', name: 'Beer — pint', volumeMl: 568, abv: 5, group: 'beer', glyph: '🍺' },
  { key: 'beer_strong_330', name: 'Strong beer — bottle', volumeMl: 330, abv: 8, group: 'beer', glyph: '🍺' },
  { key: 'beer_strong_500', name: 'Strong beer — can', volumeMl: 500, abv: 8, group: 'beer', glyph: '🍺' },
  { key: 'beer_strong', name: 'Strong beer — large', volumeMl: 650, abv: 7.5, group: 'beer', glyph: '🍺' },
  { key: 'beer_mug_1000', name: 'Beer — mug / tower', volumeMl: 1000, abv: 5, group: 'beer', glyph: '🍺' },

  // Wine
  { key: 'wine_glass', name: 'Wine — glass', volumeMl: 150, abv: 12, group: 'wine', glyph: '🍷' },
  { key: 'wine_large', name: 'Wine — large glass', volumeMl: 250, abv: 12, group: 'wine', glyph: '🍷' },
  { key: 'wine_sparkling', name: 'Sparkling — flute', volumeMl: 125, abv: 11, group: 'wine', glyph: '🥂' },
  { key: 'wine_bottle', name: 'Wine — bottle', volumeMl: 750, abv: 12.5, group: 'wine', glyph: '🍷' },

  // Spirits (Nepal/India "pegs": small 30ml, large 60ml; quarter = 180ml)
  { key: 'spirit_shot', name: 'Spirit — small peg', volumeMl: 30, abv: 40, group: 'spirits', glyph: '🥃' },
  { key: 'spirit_double', name: 'Spirit — large peg', volumeMl: 60, abv: 40, group: 'spirits', glyph: '🥃' },
  { key: 'spirit_90', name: 'Spirit — patiala', volumeMl: 90, abv: 40, group: 'spirits', glyph: '🥃' },
  { key: 'spirit_quarter', name: 'Spirit — quarter bottle', volumeMl: 180, abv: 40, group: 'spirits', glyph: '🥃' },
  { key: 'spirit_half', name: 'Spirit — half bottle', volumeMl: 375, abv: 40, group: 'spirits', glyph: '🥃' },
  { key: 'spirit_full', name: 'Spirit — full bottle', volumeMl: 750, abv: 40, group: 'spirits', glyph: '🥃' },

  // Nepal-local
  { key: 'raksi', name: 'Raksi — glass', volumeMl: 30, abv: 40, group: 'local', glyph: '🍶' },
  { key: 'raksi_large', name: 'Raksi — large', volumeMl: 90, abv: 40, group: 'local', glyph: '🍶' },
  { key: 'tongba', name: 'Tongba', volumeMl: 500, abv: 5, group: 'local', glyph: '🍶' },
  { key: 'local_lager', name: 'Local lager', volumeMl: 650, abv: 6, group: 'local', glyph: '🍺' },
  { key: 'chyaang', name: 'Chhyang', volumeMl: 330, abv: 5, group: 'local', glyph: '🍶' },

  // Other
  { key: 'cider', name: 'Cider', volumeMl: 330, abv: 5, group: 'other', glyph: '🍏' },
  { key: 'seltzer', name: 'Hard seltzer', volumeMl: 330, abv: 5, group: 'other', glyph: '🫧' },
  { key: 'breezer', name: 'Breezer / RTD', volumeMl: 275, abv: 4.8, group: 'other', glyph: '🍹' },
  { key: 'cocktail', name: 'Cocktail', volumeMl: 150, abv: 13, group: 'other', glyph: '🍸' },
];

/** Picker order. */
export const PRESET_GROUPS: DrinkPreset['group'][] = ['beer', 'wine', 'spirits', 'local', 'other'];

/** "330ml · 5%" — the detail line under a preset's name. */
export function presetDetail(p: Pick<DrinkPreset, 'volumeMl' | 'abv'>): string {
  const ml = p.volumeMl >= 1000 ? `${p.volumeMl / 1000}L` : `${p.volumeMl}ml`;
  return `${ml} · ${p.abv}%`;
}

/** Used as the "Custom" entry point in the picker — not a real preset row. */
export const CUSTOM_PRESET_KEY = 'custom';

export const PRESET_GROUP_LABELS: Record<DrinkPreset['group'], string> = {
  beer: 'Beer',
  wine: 'Wine',
  spirits: 'Spirits',
  local: 'Local',
  other: 'Other',
};

export function presetByKey(key: string): DrinkPreset | undefined {
  return DRINK_PRESETS.find((p) => p.key === key);
}

/**
 * Short label for a preset chip. The distinguishing half of "Beer — strong /
 * craft" is the qualifier, so dropping it rendered three identical "Beer" chips;
 * long slash-lists are trimmed to the first option to keep chips tappable.
 * Names without a dash (Raksi, Tongba) are returned whole.
 */
export function presetChipLabel(name: string): string {
  const [head, tail] = name.split('—').map((s) => s.trim());
  if (!tail) return head ?? name;
  const firstOption = tail.split('/')[0]!.trim();
  return `${head} · ${firstOption}`;
}
