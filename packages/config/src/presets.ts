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
  // Beer
  { key: 'beer_regular', name: 'Beer — regular', volumeMl: 330, abv: 5, group: 'beer', glyph: '🍺' },
  { key: 'beer_strong', name: 'Beer — strong / craft', volumeMl: 650, abv: 7.5, group: 'beer', glyph: '🍺' },
  { key: 'beer_pint', name: 'Beer — pint', volumeMl: 568, abv: 5, group: 'beer', glyph: '🍺' },

  // Wine
  { key: 'wine_glass', name: 'Wine — glass', volumeMl: 150, abv: 12, group: 'wine', glyph: '🍷' },
  { key: 'wine_large', name: 'Wine — large glass', volumeMl: 250, abv: 12, group: 'wine', glyph: '🍷' },

  // Spirits
  { key: 'spirit_shot', name: 'Spirit shot — whiskey / vodka / rum / gin', volumeMl: 30, abv: 40, group: 'spirits', glyph: '🥃' },
  { key: 'spirit_double', name: 'Spirit — double', volumeMl: 60, abv: 40, group: 'spirits', glyph: '🥃' },

  // Nepal-local
  { key: 'raksi', name: 'Raksi', volumeMl: 30, abv: 40, group: 'local', glyph: '🍶' },
  { key: 'tongba', name: 'Tongba', volumeMl: 500, abv: 5, group: 'local', glyph: '🍶' },
  { key: 'local_lager', name: 'Local lager (650ml)', volumeMl: 650, abv: 6, group: 'local', glyph: '🍺' },
  { key: 'chyaang', name: 'Chhyang', volumeMl: 330, abv: 5, group: 'local', glyph: '🍶' },
];

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
