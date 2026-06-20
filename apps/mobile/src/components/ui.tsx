import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ScrollView,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

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
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
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
  );
}

export function Card({
  children,
  className,
  ...props
}: ViewProps & { children: ReactNode; className?: string }) {
  return (
    <View
      className={`bg-surface border border-border rounded-2xl p-5 ${className ?? ''}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={`h-px bg-border ${className ?? ''}`} />;
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`flex-row items-center ${className ?? ''}`}>{children}</View>;
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
  primary: 'text-[#10201A]',
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
        <ActivityIndicator color={tone === 'primary' ? '#10201A' : colors.text} />
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
