import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { Txt } from './ui';
import { colors } from '../theme';

/**
 * The streak flame. It gets hotter as the streak grows, so length reads at a
 * glance before you even look at the number:
 *   0      → a grey ember (no live streak)
 *   1–6    → amber → orange
 *   7–29   → deep orange with a gold core
 *   30+    → full blaze, plus an outer glow
 */
export type FlameTier = 'ember' | 'spark' | 'flame' | 'blaze';

export function flameTier(streak: number): FlameTier {
  if (streak <= 0) return 'ember';
  if (streak < 7) return 'spark';
  if (streak < 30) return 'flame';
  return 'blaze';
}

const TIER_COLORS: Record<FlameTier, { outer: [string, string]; core: string }> = {
  ember: { outer: ['#C9D4D1', '#A9B8B4'], core: '#E3EDE9' },
  spark: { outer: ['#FBBF24', '#F97316'], core: '#FEF3C7' },
  flame: { outer: ['#FB923C', '#EA580C'], core: '#FDE68A' },
  blaze: { outer: ['#F97316', '#C2410C'], core: '#FEF08A' },
};

export function FlameIcon({ streak, size = 24 }: { streak: number; size?: number }) {
  const tier = flameTier(streak);
  const c = TIER_COLORS[tier];
  const id = `flame-${tier}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.outer[0]} />
          <Stop offset="1" stopColor={c.outer[1]} />
        </LinearGradient>
        <RadialGradient id={`${id}-g`} cx="50%" cy="60%" r="55%">
          <Stop offset="0" stopColor={colors.flameGlow} stopOpacity={0.45} />
          <Stop offset="1" stopColor={colors.flameGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {tier === 'blaze' ? <Path d="M0 0h24v24H0z" fill={`url(#${id}-g)`} /> : null}
      {/* outer flame */}
      <Path
        d="M12 2.2c.6 2.9 2.6 4.6 4.3 6.5 1.6 1.8 2.9 3.8 2.9 6.4 0 4-3.2 6.8-7.2 6.8S4.8 19.1 4.8 15.1c0-2.4 1-4.3 2.6-5.8.1 1.6.8 2.8 2 3.4-.4-3.9.6-7.6 2.6-10.5z"
        fill={`url(#${id}-o)`}
      />
      {/* inner core */}
      <Path
        d="M12.3 12.2c1.6 1.5 3 3 3 4.9 0 1.9-1.5 3.3-3.3 3.3s-3.3-1.4-3.3-3.2c0-1.4.7-2.4 1.7-3.2.1.9.5 1.5 1.1 1.8-.2-1.3.1-2.6.8-3.6z"
        fill={c.core}
      />
    </Svg>
  );
}

/** Flame + number pill: the streak, readable from across the room. */
export function StreakPill({ streak }: { streak: number }) {
  const live = streak > 0;
  return (
    <View
      className="flex-row items-center rounded-full pl-2 pr-3 py-1.5"
      style={{ backgroundColor: live ? colors.flameBg : colors.cardRaised }}
      accessibilityLabel={live ? `${streak} day streak` : 'No streak yet'}
    >
      <FlameIcon streak={streak} size={22} />
      <Txt
        variant="heading"
        className="ml-1"
        style={{ color: live ? colors.flameDeep : colors.textFaint }}
      >
        {streak}
      </Txt>
    </View>
  );
}
