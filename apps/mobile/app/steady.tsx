import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Glow } from '../src/components/Glow';
import { Button, Screen, Txt } from '../src/components/ui';
import { haptics } from '../src/lib/haptics';
import { colors } from '../src/theme';

/**
 * Steady — the urge toolbox. A single calm screen for the moment a craving
 * hits: a slow guided breath (in 4 · hold 4 · out 6) and quiet reassurance.
 * No stats, no logging, no judgment. Urges crest and pass in ~20 minutes;
 * the job here is only to help the user ride one out.
 */

type Phase = 'in' | 'hold' | 'out';

const PHASES: { key: Phase; label: string; seconds: number; scale: number }[] = [
  { key: 'in', label: 'Breathe in', seconds: 4, scale: 1 },
  { key: 'hold', label: 'Hold, gently', seconds: 4, scale: 1 },
  { key: 'out', label: 'Let it go', seconds: 6, scale: 0.62 },
];

const REASSURANCES = [
  'This feeling is a wave. It rises, crests, and passes.',
  'You don’t have to fight it — just stay with your breath.',
  'Nothing needs to happen right now.',
  'You’ve ridden this out before. You can again.',
  'Ten slow breaths from now, this will feel smaller.',
];

export default function Steady() {
  const router = useRouter();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [breaths, setBreaths] = useState(0);
  const reassurance = useRef(REASSURANCES[Math.floor(Math.random() * REASSURANCES.length)]);
  const scale = useSharedValue(0.62);

  const phase = PHASES[phaseIdx]!;

  useEffect(() => {
    scale.value = withTiming(phase.scale, {
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.sin),
    });
    if (phase.key === 'in') haptics.soft();
    const t = setTimeout(() => {
      setPhaseIdx((i) => {
        const next = (i + 1) % PHASES.length;
        if (next === 0) setBreaths((b) => b + 1);
        return next;
      });
    }, phase.seconds * 1000);
    return () => clearTimeout(t);
  }, [phaseIdx]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <View className="items-center">
          <Txt variant="label" className="text-accent">
            Steady
          </Txt>
          <Txt variant="bodyMuted" className="mt-1 text-center px-8">
            {reassurance.current}
          </Txt>
        </View>

        <View className="items-center justify-center my-12" style={{ width: 260, height: 260 }}>
          <View className="absolute" pointerEvents="none">
            <Glow size={300} color={colors.accent} opacity={0.14} />
          </View>
          {/* outer guide ring */}
          <View
            className="absolute rounded-full"
            style={{
              width: 240,
              height: 240,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}
          />
          <Animated.View
            style={[
              {
                width: 240,
                height: 240,
                borderRadius: 120,
                backgroundColor: colors.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
              },
              circleStyle,
            ]}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: colors.accent,
                opacity: 0.9,
              }}
            />
          </Animated.View>
        </View>

        <View className="items-center">
          <Txt variant="title">{phase.label}</Txt>
          <Txt variant="caption" className="mt-1">
            {breaths > 0 ? `${breaths} slow ${breaths === 1 ? 'breath' : 'breaths'} so far` : 'follow the circle'}
          </Txt>
        </View>
      </View>

      <View className="pb-4">
        <Txt variant="bodyMuted" className="text-center mb-4 px-6">
          Stay as long as you like. There’s nothing else to do here.
        </Txt>
        <Button label="I feel steadier" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
