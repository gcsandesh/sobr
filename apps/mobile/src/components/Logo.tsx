import { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark. An open circle (the journey, left open because you can
 * always begin again), an S drawn as a growing stem with two leaves (sobr, and
 * growth), and a sun rising in the opening (a new clear day). No drink imagery,
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
        <G transform="translate(32 34.5) scale(0.86) translate(-32 -34.5)">
          <Path
            d="M25 46 C31.5 48 39 44.8 38.6 39.3 C38.2 34 27.4 34.6 26.6 29.4 C26 25.6 28.6 24.4 31.6 24"
            fill="none"
            stroke="#F7F3E8"
            strokeWidth={4.2}
            strokeLinecap="round"
          />
          <Path
            d="M31.6 24 C26.8 24.2 23 21 22.4 16.6 C27.2 16.2 30.9 19.2 31.6 24 Z"
            fill="#A3D977"
          />
          <Path
            d="M31.6 24 C32.2 18.7 36.4 15.4 41.6 16 C41.2 21.2 36.8 24.3 31.6 24 Z"
            fill="#7CC25B"
          />
        </G>
      </G>
    </Svg>
  );
}
