/**
 * Re-export the shared design tokens for places className can't reach:
 * SVG fills, react-navigation theming, animated style values, etc.
 * NativeWind utility classes remain the primary styling path.
 */
export {
  colors,
  palette,
  statusColors,
  spacing,
  radii,
  fontSizes,
  motion,
  spectrum,
  stageHues,
  milestoneHues,
} from '@sobr/config';
export type { SpectrumColor } from '@sobr/config';
