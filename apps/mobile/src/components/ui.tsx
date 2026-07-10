import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

/** Soft, low-opacity elevation — never a harsh drop shadow. */
const softShadow = {
  shadowColor: '#16241C',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
} as const;

/* ── Typography ──────────────────────────────────────────────────────────── */

type TxtVariant =
  | 'display'
  | 'displaySm'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyMuted'
  | 'label'
  | 'caption';

const TXT: Record<TxtVariant, string> = {
  display: 'font-display-bold text-text text-5xl leading-none',
  displaySm: 'font-display text-text text-3xl leading-tight',
  title: 'font-display text-text text-2xl leading-tight',
  heading: 'font-semibold text-text text-lg',
  body: 'font-sans text-text text-base leading-normal',
  bodyMuted: 'font-sans text-text-muted text-base leading-normal',
  label: 'font-medium text-text-muted text-sm',
  caption: 'font-sans text-text-faint text-xs',
};

export function Txt({
  variant = 'body',
  className,
  ...props
}: TextProps & { variant?: TxtVariant; className?: string }) {
  return <Text className={`${TXT[variant]} ${className ?? ''}`} {...props} />;
}

/* ── Layout ──────────────────────────────────────────────────────────────── */

export function Screen({
  children,
  scroll = false,
  className,
}: {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
}) {
  const inner = (
    <View className={`flex-1 px-5 ${className ?? ''}`}>{children}</View>
  );
  return (
    <View className="flex-1 bg-bg">
      {/* barely-there vertical tint — keeps the white calm instead of stark */}
      <LinearGradient
        colors={['#F7FBF6', '#FFFFFF', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </View>
  );
}

export function Card({
  children,
  className,
  style,
  ...props
}: ViewProps & { children: ReactNode; className?: string }) {
  return (
    <View
      // default border is a faint hairline so callers can override with
      // border-win / border-accent etc.; bg is solid white for a clean, flat card.
      className={`relative overflow-hidden rounded-2xl border border-border bg-bg p-5 ${className ?? ''}`}
      style={[softShadow, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={`h-px bg-border ${className ?? ''}`} />;
}

export function Row({
  children,
  className,
  ...props
}: ViewProps & { children: ReactNode; className?: string }) {
  return (
    <View className={`flex-row items-center ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}

/* ── Buttons (≥44px tap targets) ─────────────────────────────────────────── */

type BtnTone = 'primary' | 'secondary' | 'ghost' | 'win' | 'danger';

const BTN_BG: Record<BtnTone, string> = {
  primary: 'bg-accent',
  secondary: 'bg-surface-raised border border-border',
  ghost: 'bg-transparent',
  win: 'bg-win-bg border border-win',
  danger: 'bg-slip-bg border border-slip',
};
const BTN_TX: Record<BtnTone, string> = {
  primary: 'text-white',
  secondary: 'text-text',
  ghost: 'text-text-muted',
  win: 'text-win',
  danger: 'text-slip',
};

export function Button({
  label,
  tone = 'primary',
  onPress,
  loading = false,
  disabled = false,
  className,
  accessibilityLabel,
}: {
  label: string;
  tone?: BtnTone;
  onPress?: PressableProps['onPress'];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`min-h-[52px] rounded-xl px-5 flex-row items-center justify-center ${BTN_BG[tone]} ${
        isDisabled ? 'opacity-50' : 'active:opacity-80'
      } ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator color={tone === 'primary' ? '#FFFFFF' : colors.text} />
      ) : (
        <Text className={`font-semibold text-base ${BTN_TX[tone]}`}>{label}</Text>
      )}
    </Pressable>
  );
}

export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  className,
}: {
  children: ReactNode;
  onPress?: PressableProps['onPress'];
  accessibilityLabel: string; // required — never an unlabeled icon button
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`min-w-[44px] min-h-[44px] items-center justify-center rounded-full active:opacity-70 ${
        className ?? ''
      }`}
    >
      {children}
    </Pressable>
  );
}

/* ── Sections, list rows, chips, avatar ──────────────────────────────────── */

/** A modern section header: bold title with an optional right-side caption. */
export function SectionHeader({
  title,
  caption,
  className,
}: {
  title: string;
  caption?: string;
  className?: string;
}) {
  return (
    <Row className={`justify-between items-baseline mb-3 ${className ?? ''}`}>
      <Txt variant="heading">{title}</Txt>
      {caption ? <Txt variant="caption">{caption}</Txt> : null}
    </Row>
  );
}

/**
 * A settings-style list row: an icon bubble, title (+ optional subtitle), and a
 * right-side element (defaults to a chevron when pressable). ≥44px tall.
 */
export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive = false,
  accessibilityLabel,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: PressableProps['onPress'];
  destructive?: boolean;
  accessibilityLabel?: string;
}) {
  const body = (
    <Row className="min-h-[52px] py-2">
      {icon ? (
        <View
          className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
            destructive ? 'bg-slip-bg' : 'bg-surface-raised'
          }`}
        >
          {icon}
        </View>
      ) : null}
      <View className="flex-1 pr-2">
        <Txt variant="body" className={destructive ? 'text-slip' : ''}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" className="mt-0.5">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </Row>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      className="active:opacity-70"
    >
      {body}
    </Pressable>
  );
}

/** A selectable pill chip — the repeated pattern for times, zones, currencies. */
export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      className={`px-4 min-h-[44px] justify-center rounded-full border ${
        selected ? 'border-accent bg-accent-bg' : 'border-border bg-surface'
      } active:opacity-70`}
    >
      <Txt variant="body" className={`text-sm ${selected ? 'text-accent font-semibold' : ''}`}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Initials avatar on a soft green disc — used on the Profile screen + headers. */
export function Avatar({ name, size = 72 }: { name: string | null; size?: number }) {
  const initials = (name ?? '?')
    .split(/[@\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <View
      className="items-center justify-center rounded-full bg-accent"
      style={{ width: size, height: size }}
      accessibilityLabel={`Avatar for ${name ?? 'you'}`}
    >
      <Text
        className="font-display text-white"
        style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}

/* ── Status pill ─────────────────────────────────────────────────────────── */

export function StatusPill({ status }: { status: 'win' | 'slip' | 'freeze' }) {
  const map = {
    win: { bg: 'bg-win-bg', tx: 'text-win', label: 'Win' },
    slip: { bg: 'bg-slip-bg', tx: 'text-slip', label: 'Slip' },
    freeze: { bg: 'bg-frozen-bg', tx: 'text-frozen', label: 'Frozen' },
  }[status];
  return (
    <View className={`px-3 py-1 rounded-full self-start ${map.bg}`}>
      <Text className={`font-semibold text-xs ${map.tx}`}>{map.label}</Text>
    </View>
  );
}

/* ── Notices & empty states ──────────────────────────────────────────────── */

/** A calm inline notice with an optional retry. Tone is never alarming. */
export function Notice({
  title,
  message,
  onRetry,
  tone = 'info',
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  tone?: 'info' | 'error';
}) {
  return (
    <View
      accessibilityRole="alert"
      className={`rounded-2xl p-4 border ${
        tone === 'error' ? 'border-slip bg-slip-bg' : 'border-border bg-surface'
      }`}
    >
      <Txt variant="body" className={tone === 'error' ? 'text-slip' : 'text-text'}>
        {title}
      </Txt>
      {message ? (
        <Txt variant="bodyMuted" className="mt-1">
          {message}
        </Txt>
      ) : null}
      {onRetry ? <Button label="Try again" tone="secondary" className="mt-3" onPress={onRetry} /> : null}
    </View>
  );
}

/** Friendly first-run / no-data placeholder. */
export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View className="items-center py-10 px-6">
      <Txt variant="heading" className="text-center">
        {title}
      </Txt>
      {message ? (
        <Txt variant="bodyMuted" className="text-center mt-2">
          {message}
        </Txt>
      ) : null}
    </View>
  );
}
