import { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark. An open circle (the journey, left open because you can
 * always begin again), a sapling growing from the ground (each clear day grows
 * something), and a sun rising in the opening (a new clear day). No drink imagery,
 * which can itself be a trigger. Mirrors assets/brand/logo.svg; keep the two in
 * step. Used at sign-in, onboarding, About and the 404 page.
 */
export function Logo({ size = 96 }: { size?: number }) {
  // unique gradient ids: on web every SVG on the page shares one id namespace
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1E6B52" />
          <Stop offset="1" stopColor="#0C3A2E" />
        </LinearGradient>
        <RadialGradient id={`hl${id}`} cx="0.25" cy="0.15" r="0.8">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.15} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`sun${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={14} fill={`url(#bg${id})`} />
      <Rect width={64} height={64} rx={14} fill={`url(#hl${id})`} />
      <G transform="translate(0 -1)">
        <Path
          d="M51.32 27.82 A20 20 0 1 1 37.18 13.68"
          fill="none"
          stroke="#F7F3E8"
          strokeWidth={3.4}
          strokeLinecap="round"
        />
        <Circle cx={46.14} cy={18.86} r={3.4} fill={`url(#sun${id})`} />
        <Path d="M20.5 46 Q32 38.5 43.5 46 Z" fill="#7CC25B" />
        <Path d="M32 43 L32 28.5" stroke="#F7F3E8" strokeWidth={3.6} strokeLinecap="round" />
        <Path
          d="M32 28.5 C26.6 28.8 22.4 25.1 21.8 20.1 C27.1 19.7 31.2 23.1 32 28.5 Z"
          fill="#A3D977"
        />
        <Path
          d="M32 28.5 C32.7 22.5 37.4 18.9 43.2 19.5 C42.7 25.3 37.8 28.8 32 28.5 Z"
          fill="#7CC25B"
        />
      </G>
    </Svg>
  );
}
