import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FlameIcon } from './StreakFlame';
import { Txt } from './ui';
import { colors } from '../theme';

/**
 * The moment a day is won: the flame pops in at the centre of the screen,
 * "+1 day" rises under it, and both drift up and fade. About a second and a
 * half, never blocks touches. Mount it with a fresh `key` per win.
 */
export function WinBurst({ streak, onDone }: { streak: number; onDone: () => void }) {
  const pop = useSharedValue(0);
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    pop.value = withSpring(1, { damping: 9, stiffness: 160 });
    rise.value = withDelay(500, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    fade.value = withDelay(700, withTiming(0, { duration: 700 }));
  }, [pop, rise, fade]);

  // Unmount once the animation has played. A ref keeps the timer from
  // restarting when the parent re-renders with a new onDone function.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), 1500);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: -60 * rise.value }, { scale: 0.4 + 0.6 * pop.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
      <Animated.View style={style} className="items-center">
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 112,
            height: 112,
            backgroundColor: colors.flameBg,
            borderWidth: 3,
            borderColor: colors.flameGlow,
            shadowColor: colors.flame,
            shadowOpacity: 0.45,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}
        >
          <FlameIcon streak={Math.max(1, streak)} size={64} />
        </View>
        <View className="mt-3 rounded-full px-4 py-1.5" style={{ backgroundColor: colors.flameDeep }}>
          <Txt variant="heading" style={{ color: '#FFF7ED' }}>
            +1 day · {streak} in a row
          </Txt>
        </View>
      </Animated.View>
    </View>
  );
}
