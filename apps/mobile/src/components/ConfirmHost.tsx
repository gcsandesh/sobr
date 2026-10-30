import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, Keyframe } from 'react-native-reanimated';
import { HomeLeafIcon as LeafIcon, TrashIcon } from './icons';
import { PressableStyled, Txt } from './ui';
import { colors } from '../theme';

/**
 * The app's own confirm dialog, replacing the platform alert for destructive
 * actions: an icon, a clear title and message, and two real buttons (the safe
 * one first). `requireText` adds a "type DELETE to confirm" step for actions
 * that can't be undone. Mount <ConfirmHost /> once at the root; call
 * confirmAction() from anywhere (src/lib/confirm.ts).
 */
export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Make the user type this word before the confirm button enables. */
  requireText?: string;
  /** 'calm' for non-destructive confirms (teal, no trash icon). Default 'danger'. */
  tone?: 'danger' | 'calm';
  onConfirm: () => void;
};

let present: ((req: ConfirmRequest) => void) | null = null;

// A short, quiet settle: fade in while rising a few points and easing from
// 97% to full size. No spring, no overshoot; a destructive question should feel
// steady, not bouncy.
const settleIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.97 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(200);

/** Show the dialog. Returns false when no host is mounted (caller falls back). */
export function presentConfirm(req: ConfirmRequest): boolean {
  if (!present) return false;
  present(req);
  return true;
}

export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    present = (r) => {
      setTyped('');
      setReq(r);
    };
    return () => {
      present = null;
    };
  }, []);

  const close = () => setReq(null);
  const calm = req?.tone === 'calm';
  const unlocked = !req?.requireText || typed.trim().toUpperCase() === req.requireText.toUpperCase();

  return (
    <Modal transparent visible={!!req} animationType="none" onRequestClose={close} statusBarTranslucent>
      {req ? (
        // plain styles: className doesn't reach reanimated's Animated.View
        <Animated.View
          entering={FadeIn.duration(180)}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            backgroundColor: 'rgba(22,33,31,0.42)',
          }}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cancel" />
          <Animated.View
            entering={settleIn}
            accessibilityRole="alert"
            style={{
              width: '100%',
              maxWidth: 380,
              borderRadius: 18,
              padding: 22,
              backgroundColor: colors.card,
              shadowColor: '#16211F',
              shadowOpacity: 0.18,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 14 },
              elevation: 16,
            }}
          >
            <View
              className="items-center justify-center mb-3"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: calm ? colors.accentBg : colors.slipBg,
              }}
            >
              {calm ? (
                <LeafIcon color={colors.accent} size={20} />
              ) : (
                <TrashIcon color={colors.slip} size={20} />
              )}
            </View>
            <Txt variant="heading" style={{ fontSize: 19 }}>
              {req.title}
            </Txt>
            <Txt variant="bodyMuted" className="mt-1.5" style={{ fontSize: 15, lineHeight: 22 }}>
              {req.message}
            </Txt>

            {req.requireText ? (
              <View className="mt-4">
                <Txt variant="label" className="mb-1.5">
                  Type {req.requireText} to confirm
                </Txt>
                <TextInput
                  value={typed}
                  onChangeText={setTyped}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder={req.requireText}
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel={`Type ${req.requireText} to confirm`}
                  style={{
                    minHeight: 48,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: unlocked ? colors.slip : colors.border,
                    backgroundColor: colors.bg,
                    paddingHorizontal: 14,
                    fontFamily: 'Figtree_600SemiBold',
                    fontSize: 16,
                    letterSpacing: 2,
                    color: colors.text,
                  }}
                />
              </View>
            ) : null}

            <View className="flex-row gap-3 mt-6">
              <DialogButton label={req.cancelLabel ?? 'Cancel'} onPress={close} />
              <DialogButton
                label={req.confirmLabel}
                danger={!calm}
                calm={calm}
                disabled={!unlocked}
                onPress={() => {
                  const run = req.onConfirm;
                  close();
                  run();
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

function DialogButton({
  label,
  onPress,
  danger = false,
  calm = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  calm?: boolean;
  disabled?: boolean;
}) {
  return (
    <PressableStyled
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={{
        flex: 1,
        minHeight: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: danger ? colors.slip : calm ? colors.accent : colors.cardRaised,
        opacity: disabled ? 0.4 : 1,
      }}
      pressedStyle={disabled ? null : { opacity: 0.85 }}
    >
      <Text
        style={{
          fontFamily: 'Figtree_600SemiBold',
          fontSize: 15,
          color: danger || calm ? '#FFFFFF' : colors.text,
        }}
      >
        {label}
      </Text>
    </PressableStyled>
  );
}
