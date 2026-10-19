import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { TrashIcon } from './icons';
import { Txt } from './ui';
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
  onConfirm: () => void;
};

let present: ((req: ConfirmRequest) => void) | null = null;

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
  const unlocked = !req?.requireText || typed.trim().toUpperCase() === req.requireText.toUpperCase();

  return (
    <Modal transparent visible={!!req} animationType="none" onRequestClose={close} statusBarTranslucent>
      {req ? (
        // plain styles: className doesn't reach reanimated's Animated.View
        <Animated.View
          entering={FadeIn.duration(160)}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            backgroundColor: 'rgba(22,33,31,0.5)',
          }}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cancel" />
          <Animated.View
            entering={ZoomIn.springify().damping(16)}
            accessibilityRole="alert"
            style={{
              width: '100%',
              maxWidth: 380,
              borderRadius: 20,
              padding: 22,
              backgroundColor: colors.card,
              shadowColor: '#16211F',
              shadowOpacity: 0.25,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 14 },
              elevation: 16,
            }}
          >
            <View
              className="items-center justify-center mb-4"
              style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.slipBg }}
            >
              <TrashIcon color={colors.slip} size={24} />
            </View>
            <Txt variant="title">{req.title}</Txt>
            <Txt variant="bodyMuted" className="mt-2">
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
                danger
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
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: danger ? colors.slip : colors.cardRaised,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
      })}
    >
      <Text
        style={{
          fontFamily: 'Figtree_700Bold',
          fontSize: 15.5,
          color: danger ? '#FFFFFF' : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
