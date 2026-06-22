import { useEffect } from 'react';
import { Modal, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import type { GrowthStageMeta } from '@sobr/config';
import { haptics } from '../lib/haptics';
import { Glow } from './Glow';
import { Tree } from './Tree';
import { Button, Txt } from './ui';

/**
 * A calm, full-screen moment when the tree reaches a new stage. Not loud — a soft
 * glow, the grown tree, and gentle words. Fires a success haptic on appear.
 */
export function GrowthCelebration({
  meta,
  onDismiss,
}: {
  meta: GrowthStageMeta;
  onDismiss: () => void;
}) {
  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: 'rgba(8,16,12,0.86)' }}
      >
        <View className="absolute items-center justify-center" pointerEvents="none">
          <Glow size={380} opacity={0.24} />
        </View>
        <Animated.View entering={FadeIn.duration(450)} className="items-center w-full">
          <Tree stage={meta.key} progress={0.4} size={200} />
          <Animated.View entering={FadeInUp.delay(150).duration(450)} className="items-center">
            <Txt variant="label" className="mt-5 text-accent">
              Your tree grew
            </Txt>
            <Txt variant="title" className="mt-1">
              {meta.label}
            </Txt>
            <Txt variant="bodyMuted" className="mt-3 text-center">
              {meta.blurb}
            </Txt>
          </Animated.View>
          <Button label="Beautiful" className="mt-10 w-full" onPress={onDismiss} />
        </Animated.View>
      </View>
    </Modal>
  );
}
