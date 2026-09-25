import { ReactNode } from 'react';
import { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  RefreshControlProps,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckIcon, ChevronRightIcon, EyeIcon, HomeLeafIcon } from './icons';
import { colors } from '../theme';

/** Soft, low-opacity elevation — never a harsh drop shadow. */
const softShadow = {
  shadowColor: '#16211F',
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

/**
 * Content never stretches past a comfortable reading width: on a tablet or a
 * desktop browser the column centers instead of running edge to edge.
 */
export const CONTENT_MAX_WIDTH = 640;

export function Screen({
  children,
  scroll = false,
  className,
  edges = ['top', 'bottom'],
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  /** Pull-to-refresh, for scrolling screens that show server data. */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Pushed screens with a native header only need the bottom inset. */
  edges?: ('top' | 'bottom')[];
}) {
  const inner = (
    <View
      className={`flex-1 px-5 w-full self-center ${className ?? ''}`}
      style={{ maxWidth: CONTENT_MAX_WIDTH }}
    >
      {children}
    </View>
  );
  return (
    <View className="flex-1 bg-bg">
      {/* barely-there vertical tint — keeps the cream calm instead of flat */}
      <LinearGradient
        colors={['#FAFDFC', '#F0F5F3', '#E3EDE9']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView className="flex-1" edges={edges}>
        {scroll ? (
          // Keyboard-aware: Android is edge-to-edge on SDK 54, so the window no
          // longer resizes for the keyboard. This scrolls the focused field
          // into view instead of leaving it under the keys.
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
            refreshControl={refreshControl}
          >
            {inner}
          </KeyboardAwareScrollView>
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
      // Cards sit on `surface` (warm white), one step LIGHTER than the cream
      // canvas — that luminance gap is what gives the screen depth. Default
      // border is a faint hairline so callers can override with border-win /
      // border-accent etc.
      className={`relative overflow-hidden rounded-2xl border border-border bg-surface p-5 ${className ?? ''}`}
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

// `secondary` is an accent-tinted outline, not a tan slab — a flat tan button on
// a cream card reads as disabled rather than tappable.
const BTN_BG: Record<BtnTone, string> = {
  primary: 'bg-accent',
  secondary: 'bg-accent-bg border border-accent',
  ghost: 'bg-transparent',
  win: 'bg-win-bg border border-win',
  danger: 'bg-slip-bg border border-slip',
};
const BTN_TX: Record<BtnTone, string> = {
  primary: 'text-white',
  secondary: 'text-accent',
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
      // Selected is a SOLID accent fill, not a tint: two pale fills separated
      // only by border color made the active state easy to miss.
      className={`px-4 min-h-[44px] justify-center rounded-full border ${
        selected ? 'border-accent bg-accent' : 'border-border bg-surface-raised'
      } active:opacity-70`}
    >
      <Txt
        variant="body"
        className={`text-sm ${selected ? 'font-semibold' : ''}`}
        style={selected ? { color: '#F4FAF8' } : undefined}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

/**
 * Initials avatar on a terracotta disc. With no name to derive initials from it
 * falls back to the leaf mark rather than a bare "?", which read as an error.
 */
export function Avatar({ name, size = 72 }: { name: string | null; size?: number }) {
  const initials = (name ?? '')
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
      {initials ? (
        <Text
          className="font-display text-white"
          style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}
        >
          {initials}
        </Text>
      ) : (
        <HomeLeafIcon color="#F4FAF8" size={size * 0.46} />
      )}
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

/**
 * Friendly first-run / no-data placeholder. Contained in a card so it reads as
 * a deliberate state rather than text floating on the canvas; `icon` gives it a
 * focal point.
 */
export function EmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="items-center py-8 px-6">
      {icon ? (
        <View className="w-14 h-14 rounded-full items-center justify-center mb-3 bg-accent-bg">
          {icon}
        </View>
      ) : null}
      <Txt variant="heading" className="text-center">
        {title}
      </Txt>
      {message ? (
        <Txt variant="bodyMuted" className="text-center mt-2">
          {message}
        </Txt>
      ) : null}
    </Card>
  );
}

/* ── Form fields ─────────────────────────────────────────────────────────── */

/**
 * A labelled text input with an inline, calm error line. Password fields get a
 * show/hide toggle, since typing blind on a phone keyboard is the main reason
 * sign-in fails.
 */
export const TextField = forwardRef<
  TextInput,
  TextInputProps & { label: string; error?: string | null; hint?: string; className?: string }
>(function TextField({ label, error, hint, secureTextEntry, className, ...props }, ref) {
  const [hidden, setHidden] = useState(true);
  const isSecret = !!secureTextEntry;
  return (
    <View className={className}>
      <Txt variant="label" className="mb-1.5">
        {label}
      </Txt>
      <View
        className={`flex-row items-center rounded-xl border bg-surface ${
          error ? 'border-slip' : 'border-border'
        }`}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={isSecret && hidden}
          accessibilityLabel={label}
          className="flex-1 px-4 py-3.5 text-text font-sans text-base"
          style={{ minHeight: 52 }}
          {...props}
        />
        {isSecret ? (
          <IconButton
            onPress={() => setHidden((h) => !h)}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            className="mr-1"
          >
            <EyeIcon color={colors.textFaint} off={!hidden} />
          </IconButton>
        ) : null}
      </View>
      {error ? (
        <Txt variant="caption" className="mt-1.5 text-slip" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" className="mt-1.5">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});

/* ── Option list (used inside sheets) ────────────────────────────────────── */

/**
 * A vertical single-select list: title, optional subtitle, and a check on the
 * selected row. Replaces the old walls of chips for long option sets
 * (currencies, time zones), which were hard to scan.
 */
export function OptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; title: string; subtitle?: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <View className="rounded-2xl border border-border bg-surface overflow-hidden">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.subtitle ? `${o.title}, ${o.subtitle}` : o.title}
            className={`flex-row items-center px-4 min-h-[56px] py-2 active:opacity-70 ${
              i > 0 ? 'border-t border-border' : ''
            } ${selected ? 'bg-accent-bg' : ''}`}
          >
            <View className="flex-1 pr-3">
              <Txt variant="body" className={selected ? 'font-semibold text-accent' : ''}>
                {o.title}
              </Txt>
              {o.subtitle ? (
                <Txt variant="caption" className="mt-0.5">
                  {o.subtitle}
                </Txt>
              ) : null}
            </View>
            {selected ? <CheckIcon color={colors.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** A right-aligned value + chevron, the trailing element of a tappable ListRow. */
export function RowValue({ value }: { value?: string }) {
  return (
    <Row className="gap-1">
      {value ? (
        <Txt variant="label" numberOfLines={1} style={{ maxWidth: 160 }}>
          {value}
        </Txt>
      ) : null}
      <ChevronRightIcon color={colors.textFaint} />
    </Row>
  );
}

/** A ListRow with a switch: the one pattern for every on/off preference. */
export function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Row>
      <View className="flex-1 pr-3">
        <ListRow icon={icon} title={title} subtitle={subtitle} />
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        accessibilityLabel={title}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </Row>
  );
}
