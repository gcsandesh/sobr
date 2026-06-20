import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * sobr logo mark — a single sprout rising through an open ring. The ring nods to
 * "days, counted"; the sprout to quiet growth. Calm, modern, not literal.
 * Used at sign-in, onboarding, and as the basis for the app icon.
 */
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Defs>
        <LinearGradient id="leaf" x1="48" y1="20" x2="48" y2="64">
          <Stop offset="0" stopColor="#A6CE8C" />
          <Stop offset="1" stopColor="#74AA64" />
        </LinearGradient>
      </Defs>

      {/* open ring — a year of days, not quite closed (room to grow) */}
      <Path
        d="M48 12 A36 36 0 1 1 20 26"
        stroke="#E6B45C"
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />

      {/* stem */}
      <Path d="M48 74 L48 44" stroke="#E6B45C" strokeWidth={6} strokeLinecap="round" />

      {/* two leaves */}
      <Path
        d="M48 50 C40 50 33 45 31 36 C40 35 47 40 48 50 Z"
        fill="url(#leaf)"
      />
      <Path
        d="M48 46 C56 46 63 40 65 31 C56 30 49 36 48 46 Z"
        fill="url(#leaf)"
      />

      {/* seed-point */}
      <Circle cx={48} cy={44} r={4} fill="#C7E3AE" />
    </Svg>
  );
}
