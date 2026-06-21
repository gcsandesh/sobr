import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * sobr logo mark — a tapering growth coil: thin + dark where the journey starts,
 * thickening and brightening toward the amber "today" node. Quiet momentum, days
 * accumulating. Used at sign-in, onboarding, and the loading state.
 */
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="sobrBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#16221C" />
          <Stop offset="100%" stopColor="#0E1614" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={14} fill="url(#sobrBg)" />

      {/* tapering coil: thin & dark at the start, thick & bright near today */}
      <Path
        d="M36.00,36.00 C36.08,36.22 36.47,36.84 36.46,37.34 C36.45,37.85 36.31,38.52 35.95,39.03 C35.59,39.54 35.00,40.11 34.31,40.39 C33.63,40.67 32.69,40.86 31.84,40.73"
        fill="none"
        stroke="#4D6B4A"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M31.84,40.73 C30.99,40.60 29.95,40.22 29.19,39.59 C28.43,38.96 27.66,38.00 27.27,36.96 C26.89,35.92 26.67,34.55 26.88,33.33 C27.09,32.11 27.65,30.69 28.51,29.64"
        fill="none"
        stroke="#5C8A57"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28.51,29.64 C29.37,28.59 30.67,27.55 32.06,27.01 C33.45,26.47 35.24,26.18 36.84,26.41 C38.44,26.64 40.27,27.32 41.65,28.38 C43.03,29.44 44.40,31.05 45.14,32.76"
        fill="none"
        stroke="#7FB069"
        strokeWidth={5.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M45.14,32.76 C45.88,34.48 46.31,36.69 46.11,38.67 C45.91,40.66 45.16,42.93 43.95,44.67 C42.74,46.41 40.87,48.14 38.85,49.13 C36.83,50.13 33.02,50.39 31.85,50.64"
        fill="none"
        stroke="#9ED48A"
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle cx={36.0} cy={36.0} r={2} fill="#3A4A3D" />
      <Circle cx={31.84} cy={40.73} r={2.5} fill="#5C8A57" />
      <Circle cx={28.51} cy={29.64} r={3} fill="#7FB069" />
      <Circle cx={45.14} cy={32.76} r={3.8} fill="#9ED48A" />
      <Circle cx={31.85} cy={50.64} r={5.5} fill="#E8B86D" />
    </Svg>
  );
}
