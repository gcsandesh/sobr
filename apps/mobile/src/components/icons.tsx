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

/** Soft "sliders" mark — reads as calm/adjustable rather than mechanical. */
export function GearIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h6M14 6h6M4 12h11M19 12h1M4 18h6M14 18h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={6} r={2.2} fill={color} />
      <Circle cx={17} cy={12} r={2.2} fill={color} />
      <Circle cx={12} cy={18} r={2.2} fill={color} />
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

export function CloseIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function UserIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path
        d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SparkIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" fill={color} />
    </Svg>
  );
}

export function GlobeIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}

export function TargetIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
    </Svg>
  );
}

export function WalletIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={13} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M3 10h18" stroke={color} strokeWidth={2} />
      <Circle cx={16.5} cy={14.5} r={1.4} fill={color} />
    </Svg>
  );
}

export function LogOutIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M17 8l4 4-4 4M21 12H10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The Google "G" mark (brand colors). */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

/* ── added with the "complete app" pass ──────────────────────────────────── */

function Stroke({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}
const line = (color: string) =>
  ({ stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }) as const;

export function CheckIcon({ color, size = 20 }: IconProps) {
  return (
    <Stroke size={size}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" {...line(color)} strokeWidth={2.2} />
    </Stroke>
  );
}

export function EyeIcon({ color, size = 22, off = false }: IconProps & { off?: boolean }) {
  return (
    <Stroke size={size}>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...line(color)} />
      <Circle cx={12} cy={12} r={3} {...line(color)} />
      {off ? <Path d="M4 4l16 16" {...line(color)} /> : null}
    </Stroke>
  );
}

/** An open book: the day-by-day history / reflections. */
export function BookIcon({ color, size = 22 }: IconProps) {
  return (
    <Stroke size={size}>
      <Path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" {...line(color)} />
      <Path d="M12 6.5v13" {...line(color)} />
    </Stroke>
  );
}

/** A lifebuoy: support and someone-to-talk-to resources. */
export function LifebuoyIcon({ color, size = 22 }: IconProps) {
  return (
    <Stroke size={size}>
      <Circle cx={12} cy={12} r={8.5} {...line(color)} />
      <Circle cx={12} cy={12} r={3.5} {...line(color)} />
      <Path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" {...line(color)} />
    </Stroke>
  );
}

export function LockIcon({ color, size = 22 }: IconProps) {
  return (
    <Stroke size={size}>
      <Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} {...line(color)} />
      <Path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" {...line(color)} />
    </Stroke>
  );
}

export function ShieldIcon({ color, size = 22 }: IconProps) {
  return (
    <Stroke size={size}>
      <Path d="M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3l7-2.8z" {...line(color)} />
      <Path d="M9 12l2 2 4-4" {...line(color)} />
    </Stroke>
  );
}

export function DocIcon({ color, size = 22 }: IconProps) {
  return (
    <Stroke size={size}>
      <Path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5A.5.5 0 016.5 20V4a.5.5 0 01.5-.5z" {...line(color)} />
      <Path d="M13.5 3.5V8h4.5M9.5 12.5h5M9.5 16h5" {...line(color)} />
    </Stroke>
  );
}

export function PencilIcon({ color, size = 20 }: IconProps) {
  return (
    <Stroke size={size}>
      <Path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 013 3L8 18.5 4 20z" {...line(color)} />
      <Path d="M13.5 7l3 3" {...line(color)} />
    </Stroke>
  );
}

export function InfoIcon({ color, size = 22 }: IconProps) {
  return (
    <Stroke size={size}>
      <Circle cx={12} cy={12} r={8.5} {...line(color)} />
      <Path d="M12 11v5.5M12 7.8v.1" {...line(color)} strokeWidth={2.2} />
    </Stroke>
  );
}
