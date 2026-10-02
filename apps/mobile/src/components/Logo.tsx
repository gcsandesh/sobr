import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark, "the chip": a sobriety medallion (gold ring) holding a
 * sunrise. Recovery's most recognisable symbol plus "a clear day", with no
 * drink imagery (which can itself be a trigger). Mirrors
 * assets/brand/icon.svg; keep the two in step. Used at sign-in, onboarding,
 * About and the 404 page.
 */
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="sobrBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E9D95" />
          <Stop offset="1" stopColor="#14504D" />
        </LinearGradient>
        <LinearGradient id="sobrGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
        <LinearGradient id="sobrSun" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDBA74" />
          <Stop offset="1" stopColor="#F97316" />
        </LinearGradient>
        <ClipPath id="sobrInner">
          <Circle cx={32} cy={32} r={15.5} />
        </ClipPath>
      </Defs>
      <Rect width={64} height={64} rx={14} fill="url(#sobrBg)" />
      <Circle cx={32} cy={32} r={19} fill="none" stroke="url(#sobrGold)" strokeWidth={3.2} />
      <G clipPath="url(#sobrInner)">
        <Rect x={10} y={10} width={44} height={44} fill="#F4FAF8" />
        <Circle cx={32} cy={37} r={7.5} fill="url(#sobrSun)" />
        <Rect x={10} y={37} width={44} height={20} fill="#1F6F6B" />
        <Path d="M10 41.5 Q32 38.5 54 41.5" stroke="#2E9D95" strokeWidth={1.6} fill="none" />
      </G>
      <Path
        d="M32 24.2v2.4M23.6 28.4l1.7 1.5M40.4 28.4l-1.7 1.5"
        stroke="#F97316"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
