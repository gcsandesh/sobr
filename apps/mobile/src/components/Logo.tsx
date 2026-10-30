import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark: a sapling with two leaves growing from a hill, inside a
 * circle, on cream. Simple on purpose: each clear day grows something. No drink
 * imagery, which can itself be a trigger. Mirrors assets/brand/logo.svg; keep
 * the two in step. Used at sign-in, onboarding, About and the 404 page.
 */
export function Logo({ size = 96 }: { size?: number }) {
  // unique ids: on web every SVG on the page shares one id namespace
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <ClipPath id={`in${id}`}>
          <Circle cx={32} cy={32} r={21.9} />
        </ClipPath>
        <LinearGradient id={`hill${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3B7A39" />
          <Stop offset="1" stopColor="#1B4628" />
        </LinearGradient>
        <LinearGradient id={`leafL${id}`} x1="1" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#3E8A33" />
          <Stop offset="1" stopColor="#80C65C" />
        </LinearGradient>
        <LinearGradient id={`leafR${id}`} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#3E8A33" />
          <Stop offset="1" stopColor="#8ACB62" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={14} fill="#FAF8F2" />
      <Circle cx={32} cy={32} r={22.6} fill="none" stroke="#1E3F2A" strokeWidth={1.9} />
      <G clipPath={`url(#in${id})`}>
        <Path
          d="M4 52 C12 44 22 40.6 32 40.6 C42 40.6 52 44 60 52 V60 H4 Z"
          fill={`url(#hill${id})`}
        />
        <Path
          d="M10.5 47.5 C17 43.6 24 41.8 31 41.6"
          fill="none"
          stroke="#6BA858"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.75}
        />
      </G>
      <Path
        d="M32 41 C32.3 37 31.9 33.5 31.7 29.6"
        fill="none"
        stroke="#2F6B30"
        strokeWidth={2.1}
        strokeLinecap="round"
      />
      <Path
        d="M31.7 31.2 C27 32 21 29.6 19.2 22.4 C25.6 21 30.6 24.6 31.7 31.2 Z"
        fill={`url(#leafL${id})`}
      />
      <Path
        d="M31.8 29.8 C32.2 23.4 37.2 18.4 45 18.8 C44.4 26 38.8 30.6 31.8 29.8 Z"
        fill={`url(#leafR${id})`}
      />
      <Path
        d="M30.6 30.4 C27.6 28.8 24.2 26.6 21.4 24"
        fill="none"
        stroke="#2F6B30"
        strokeWidth={0.6}
        opacity={0.5}
      />
      <Path
        d="M33 28.8 C36.2 26.4 39.4 23.6 42.8 20.6"
        fill="none"
        stroke="#2F6B30"
        strokeWidth={0.6}
        opacity={0.5}
      />
    </Svg>
  );
}
