import { useId } from 'react';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * A soft radial glow — used behind the home tree to give the focal point warmth
 * and depth. Low opacity, calm. Render it absolutely-positioned behind content.
 */
export function Glow({
  size = 320,
  color = '#2E9D95',
  opacity = 0.14,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="60%" stopColor={color} stopOpacity={opacity * 0.4} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}
