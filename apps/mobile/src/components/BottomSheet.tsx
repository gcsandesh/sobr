import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { Row, Txt } from './ui';
import { CloseIcon } from './icons';

/**
 * A slide-up sheet — the prototype's preferred pattern for quick actions
 * (add a drink, day detail) instead of a full page navigation. Backdrop tap
 * dismisses; the sheet itself is a Pressable with a no-op handler so taps on
 * its own (non-interactive) padding don't fall through to the backdrop.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  maxHeightPct = 0.82,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional header row with a title + close button above the scrollable content. */
  title?: string;
  maxHeightPct?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(22,33,31,0.45)' }}
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radii['2xl'],
            borderTopRightRadius: radii['2xl'],
            maxHeight: `${maxHeightPct * 100}%`,
            paddingBottom: Math.max(20, insets.bottom + 8),
          }}
        >
          <View className="items-center pt-3 pb-2">
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.borderStrong,
              }}
            />
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {title ? (
              <Row className="justify-between items-center mb-4">
                <Txt variant="heading">{title}</Txt>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="p-1"
                >
                  <CloseIcon color={colors.textFaint} />
                </Pressable>
              </Row>
            ) : null}
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
