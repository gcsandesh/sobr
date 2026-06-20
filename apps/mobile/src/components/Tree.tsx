import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import type { GrowthStageKey } from '@sobr/core';
import { palette } from '../theme';

/**
 * The growth tree — anchored to LIFETIME win days, so it never visibly regresses
 * on a slip. Geometry scales with the stage; a slow "breathing" scale gives it a
 * calm, living quality without per-frame SVG animation. Real craft, not an icon swap.
 */

const STAGE_INDEX: Record<GrowthStageKey, number> = {
  seed: 0,
  sprout: 1,
  sapling: 2,
  young_tree: 3,
  tree: 4,
  grove: 5,
};

type Cluster = { cx: number; cy: number; r: number };

// Foliage clusters per stage (canopy fullness grows with the stage).
function canopy(stageIndex: number, progress: number): Cluster[] {
  const grow = stageIndex + progress * 0.6;
  switch (stageIndex) {
    case 0: // seed — no canopy, just a sprout dot handled separately
      return [];
    case 1: // sprout
      return [{ cx: 100, cy: 120, r: 16 + grow * 3 }];
    case 2: // sapling
      return [
        { cx: 100, cy: 104, r: 30 },
        { cx: 84, cy: 116, r: 18 },
        { cx: 116, cy: 116, r: 18 },
      ];
    case 3: // young tree
      return [
        { cx: 100, cy: 92, r: 38 },
        { cx: 76, cy: 110, r: 26 },
        { cx: 124, cy: 110, r: 26 },
      ];
    case 4: // full tree
      return [
        { cx: 100, cy: 80, r: 46 },
        { cx: 70, cy: 104, r: 32 },
        { cx: 130, cy: 104, r: 32 },
        { cx: 100, cy: 60, r: 30 },
      ];
    default: // grove — a fuller, wider canopy
      return [
        { cx: 100, cy: 78, r: 48 },
        { cx: 64, cy: 104, r: 34 },
        { cx: 136, cy: 104, r: 34 },
        { cx: 100, cy: 56, r: 32 },
        { cx: 42, cy: 122, r: 24 },
        { cx: 158, cy: 122, r: 24 },
      ];
  }
}

// Trunk height grows with stage.
function trunkTop(stageIndex: number): number {
  return [156, 134, 118, 96, 78, 76][stageIndex] ?? 96;
}

export function Tree({
  stage,
  progress,
  size = 220,
}: {
  stage: GrowthStageKey;
  progress: number;
  size?: number;
}) {
  const idx = STAGE_INDEX[stage];
  const clusters = canopy(idx, progress);
  const top = trunkTop(idx);

  const breathe = useSharedValue(1);
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.035, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${stage} stage tree`}>
      <Animated.View style={animStyle}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="foliage" x1="100" y1="40" x2="100" y2="140">
              <Stop offset="0" stopColor="#A6CE8C" />
              <Stop offset="1" stopColor={palette.win} />
            </LinearGradient>
          </Defs>

          {/* ground */}
          <Path
            d="M40 168 Q100 150 160 168"
            stroke={palette.border}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />

          {idx === 0 ? (
            // seed: a small mound + sprout
            <>
              <Ellipse cx={100} cy={166} rx={26} ry={9} fill={palette.surfaceRaised} />
              <Path
                d="M100 166 L100 146"
                stroke={palette.accent}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <Circle cx={100} cy={142} r={6} fill={palette.win} />
            </>
          ) : (
            <>
              {/* trunk */}
              <Path
                d={`M100 168 L100 ${top}`}
                stroke={palette.accent}
                strokeWidth={idx >= 3 ? 8 : 5}
                strokeLinecap="round"
              />
              {idx >= 3 && (
                <>
                  <Path
                    d="M100 120 Q82 104 76 86"
                    stroke={palette.accent}
                    strokeWidth={5}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Path
                    d="M100 112 Q120 98 126 82"
                    stroke={palette.accent}
                    strokeWidth={5}
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}
              {/* canopy */}
              {clusters.map((c, i) => (
                <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="url(#foliage)" />
              ))}
              {/* soft highlight */}
              {clusters[0] && (
                <Circle
                  cx={clusters[0].cx - clusters[0].r * 0.3}
                  cy={clusters[0].cy - clusters[0].r * 0.3}
                  r={clusters[0].r * 0.28}
                  fill="#C7E3AE"
                  opacity={0.5}
                />
              )}
            </>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
