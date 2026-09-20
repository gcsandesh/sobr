import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark — one bold tilted leaf on a warm terracotta card. Deliberately
 * a single minimal symbol, not green-heavy. Used at sign-in, onboarding, About,
 * and Home.
 */
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="sobrBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#2E9D95" />
          <Stop offset="100%" stopColor="#1F6F6B" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={14} fill="url(#sobrBg)" />

      <G rotation={-28} origin="32,32">
        <Path d="M32 11 C45 18 49 31 32 53 C15 31 19 18 32 11 Z" fill="#F4FAF8" />
        <Path d="M32 17 L32 47" stroke="#1F6F6B" strokeWidth={2} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
