import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Minimal line icons (stroke-based) for the tab bar + small UI affordances. */
type IconProps = { color: string; size?: number };

export function HomeLeafIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21V11" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M12 13C8.5 13 6 10.5 5.5 6.5C9.5 6.5 12 9 12 13Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M12 11C15 11 17.5 9 18.5 5.5C14.5 5.5 12.5 7.5 12 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M3 9H21M8 3V6M16 3V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChartIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20V10M12 20V4M20 20V14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SnowflakeIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlusIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
