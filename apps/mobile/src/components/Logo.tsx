import { useId } from 'react';
import Svg, { Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark: a checkmark that sprouts. The tick is a clear day done; its
 * rising stroke ends in a warm leaf, because every clear day grows something.
 * No drink imagery (which can itself be a trigger). Mirrors
 * assets/brand/logo.svg; keep the two in step. Used at sign-in, onboarding,
 * About and the 404 page.
 */
export function Logo({ size = 96 }: { size?: number }) {
  // unique gradient ids: on web every SVG on the page shares one id namespace
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#22857D" />
          <Stop offset="1" stopColor="#0E4542" />
        </LinearGradient>
        <RadialGradient id={`hl${id}`} cx="0.25" cy="0.15" r="0.8">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`leaf${id}`} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#F97316" />
          <Stop offset="1" stopColor="#FBBF24" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={14} fill={`url(#bg${id})`} />
      <Rect width={64} height={64} rx={14} fill={`url(#hl${id})`} />
      <G transform="translate(-1.7 2.2)">
        <Path
          d="M15.5 35 L26.5 46 L39.5 30.5"
          fill="none"
          stroke="#F7F3E8"
          strokeWidth={6.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M39.5 30.5 C37.8 19.5 44.5 11.5 55 10.5 C56 21.5 50 29.5 39.5 30.5 Z"
          fill={`url(#leaf${id})`}
        />
        <Path
          d="M41.5 28.5 C44.5 23 48 18 52.5 13.5"
          stroke="#9A3412"
          strokeOpacity={0.35}
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}
