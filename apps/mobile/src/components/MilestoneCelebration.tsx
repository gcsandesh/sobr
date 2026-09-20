import { useEffect } from 'react';
import { Modal, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import type { Milestone } from '@sobr/core';
import { haptics } from '../lib/haptics';
import { colors } from '../theme';
import { Glow } from './Glow';
import { SparkIcon } from './icons';
import { Button, Txt } from './ui';

/** A calm full-screen moment when a lifetime clear-day milestone is reached. */
export function MilestoneCelebration({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: 'rgba(240,245,243,0.94)' }}
      >
        <View className="absolute items-center justify-center" pointerEvents="none">
          <Glow size={380} color={colors.accent} opacity={0.16} />
        </View>
        <Animated.View entering={FadeIn.duration(450)} className="items-center w-full">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 96, height: 96, backgroundColor: colors.accentBg }}
          >
            <SparkIcon color={colors.accent} size={44} />
          </View>
          <Animated.View entering={FadeInUp.delay(150).duration(450)} className="items-center">
            <Txt variant="label" className="mt-5 text-accent">
              Milestone reached
            </Txt>
            <Txt variant="title" className="mt-1">
              {milestone.label}
            </Txt>
            <Txt variant="bodyMuted" className="mt-3 text-center">
              {milestone.blurb}
            </Txt>
          </Animated.View>
          <Button label="Keep going" className="mt-10 w-full" onPress={onDismiss} />
        </Animated.View>
      </View>
    </Modal>
  );
}
