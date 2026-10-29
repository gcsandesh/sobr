import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { ForestTree, GrowthStageKey } from '@sobr/core';
import { GROWTH_STAGES } from '@sobr/config';
import { Tree, type Foliage } from './Tree';
import { Row, Txt } from './ui';
import { formatDay } from '../lib/dates';
import { colors } from '../theme';

/**
 * The forest as a place, not a list: a dawn landscape with every finished
 * streak standing in it as a tree, oldest on the left. Bigger streaks grow
 * bigger trees; alternate trees step back a row so a long history reads as
 * depth instead of a queue. Below it, the numbers and each tree's dates.
 */

const SCENE_H = 196;
const FRONT_GROUND = SCENE_H - 20;
const BACK_GROUND = SCENE_H - 46;
const MAX_IN_SCENE = 14;

const STAGE_SIZE: Record<GrowthStageKey, number> = {
  seed: 50,
  sprout: 64,
  sapling: 80,
  young_tree: 96,
  tree: 112,
  grove: 126,
};

/**
 * Each tree wears the season its streak began in, so the forest doubles as a
 * record of when you grew it: fresh spring lime, deep summer green, autumn
 * amber, winter frost.
 */
const SEASONS: { name: string; foliage: Foliage; chip: { fg: string; bg: string } }[] = [
  {
    name: 'winter',
    foliage: { top: '#A7D8D2', bottom: '#2F6F73', light: '#E2F4F1' },
    chip: { fg: '#2F6F73', bg: '#E0F2F1' },
  },
  {
    name: 'spring',
    foliage: { top: '#C5E384', bottom: '#5F9E2F', light: '#ECF7D2' },
    chip: { fg: '#4D7C0F', bg: '#ECFCCB' },
  },
  {
    name: 'summer',
    foliage: { top: '#8CC66A', bottom: '#2F6B2C', light: '#D7EBB5' },
    chip: { fg: '#2F6B2C', bg: '#DCF1D0' },
  },
  {
    name: 'autumn',
    foliage: { top: '#FCC66B', bottom: '#C2561A', light: '#FDE8C2' },
    chip: { fg: '#B45309', bg: '#FEF3C7' },
  },
];

/** Northern-hemisphere seasons by month; Dec-Feb winter, Mar-May spring… */
function seasonOf(date: string) {
  const month = Number(date.slice(5, 7));
  return SEASONS[Math.floor((month % 12) / 3)]!;
}

/** Small, stable wobble from a date string, so trees don't sit on a grid. */
function jitter(seed: string, range: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * range;
}

export function ForestScene({ trees }: { trees: ForestTree[] }) {
  const [width, setWidth] = useState(0);
  // forestTrees is newest first; the landscape reads left to right in time
  const planted = [...trees.slice(0, MAX_IN_SCENE)].reverse();
  const totalDays = trees.reduce((n, t) => n + t.length, 0);
  const longest = trees.reduce((n, t) => Math.max(n, t.length), 0);

  const slots = Math.max(planted.length, 1);
  const placed = planted.map((t, i) => {
    const back = planted.length > 3 && i % 2 === 1;
    const step = width / (slots + 1);
    const x = step * (i + 1) + jitter(t.start, step * 0.5);
    const size = STAGE_SIZE[t.stage] * (back ? 0.78 : 1);
    const ground = back ? BACK_GROUND : FRONT_GROUND + jitter(t.end, 6);
    return { t, x, size, ground, back };
  });
  // back row first, so the front row overlaps it
  placed.sort((a, b) => Number(b.back) - Number(a.back));

  return (
    <View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: SCENE_H, borderRadius: 16, overflow: 'hidden' }}
        accessibilityLabel={
          trees.length
            ? `Your forest: ${trees.length} trees from past streaks`
            : 'Your forest, waiting for its first tree'
        }
      >
        <Svg width="100%" height={SCENE_H} viewBox={`0 0 320 ${SCENE_H}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FDE3C4" />
              <Stop offset="0.55" stopColor="#F3EEDD" />
              <Stop offset="1" stopColor="#DDF0E8" />
            </LinearGradient>
            <RadialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FBBF24" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#FBBF24" stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FDE68A" />
              <Stop offset="1" stopColor="#F59E0B" />
            </LinearGradient>
            <LinearGradient id="meadow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#9ACBB2" />
              <Stop offset="1" stopColor="#6FAE90" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={320} height={SCENE_H} fill="url(#sky)" />
          <Circle cx={248} cy={74} r={56} fill="url(#sunGlow)" />
          <Circle cx={248} cy={74} r={22} fill="url(#sun)" />
          {/* far ridge, near hill, meadow */}
          <Path
            d={`M0 ${SCENE_H - 70} Q60 ${SCENE_H - 104} 120 ${SCENE_H - 82} T240 ${SCENE_H - 90} T320 ${SCENE_H - 76} V${SCENE_H} H0 Z`}
            fill="#C9E4D8"
          />
          <Path
            d={`M0 ${SCENE_H - 52} Q90 ${SCENE_H - 78} 170 ${SCENE_H - 58} T320 ${SCENE_H - 60} V${SCENE_H} H0 Z`}
            fill="#B2D8C6"
          />
          <Path
            d={`M0 ${SCENE_H - 30} Q160 ${SCENE_H - 44} 320 ${SCENE_H - 30} V${SCENE_H} H0 Z`}
            fill="url(#meadow)"
          />
          {/* clouds */}
          <Path
            d="M38 52 a10 10 0 0 1 18 -6 a13 13 0 0 1 24 4 a9 9 0 0 1 2 17 h-40 a8 8 0 0 1 -4 -15 z"
            fill="#FFFFFF"
            opacity={0.75}
          />
          <Path
            d="M150 34 a8 8 0 0 1 14 -4 a10 10 0 0 1 18 3 a7 7 0 0 1 1 13 h-31 a6 6 0 0 1 -2 -12 z"
            fill="#FFFFFF"
            opacity={0.6}
          />
          {/* two birds heading home */}
          <Path
            d="M196 58 q4 -4 8 0 q4 -4 8 0 M214 46 q3 -3 6 0 q3 -3 6 0"
            stroke="#5B6B67"
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
          {/* grass tufts and a few wildflowers along the front */}
          {[18, 64, 112, 158, 206, 252, 298].map((x, i) => (
            <Path
              key={`g${x}`}
              d={`M${x} ${SCENE_H - 6} l-3 -${7 + (i % 3)} M${x} ${SCENE_H - 6} l0 -${9 + (i % 2) * 2} M${x} ${SCENE_H - 6} l3 -${7 + ((i + 1) % 3)}`}
              stroke="#4E8F6E"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          ))}
          {[
            [40, '#F59E0B'],
            [90, '#FFFFFF'],
            [136, '#F43F5E'],
            [182, '#FFFFFF'],
            [228, '#8B5CF6'],
            [276, '#F59E0B'],
          ].map(([x, c]) => (
            <Circle key={`f${x}`} cx={x as number} cy={SCENE_H - 12} r={2.2} fill={c as string} />
          ))}
        </Svg>

        {width > 0 &&
          (placed.length ? (
            placed.map(({ t, x, size, ground, back }) => (
              <View
                key={t.start}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: x - size / 2,
                  // the tree's base sits at 84% of its box
                  top: ground - size * 0.84,
                  opacity: back ? 0.88 : 1,
                }}
              >
                <Tree stage={t.stage} progress={1} size={size} foliage={seasonOf(t.start).foliage} />
              </View>
            ))
          ) : (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: width / 2 - 28, top: FRONT_GROUND - 56 * 0.84 }}
            >
              <Tree stage="seed" progress={0} size={56} />
            </View>
          ))}
      </View>

      {trees.length === 0 ? (
        <Txt variant="bodyMuted" className="text-sm mt-4">
          When a streak of 3 days or more ends, its tree is planted here. A slip resets the tree
          on Home, but what you grew stays.
        </Txt>
      ) : (
        <>
          <Row className="mt-4 gap-2">
            <ForestStat value={String(trees.length)} label={trees.length === 1 ? 'tree' : 'trees'} />
            <ForestStat value={String(totalDays)} label="days grown" />
            <ForestStat value={String(longest)} label="longest" />
          </Row>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3 -mx-5"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {trees.map((t) => {
              const season = seasonOf(t.start);
              const hue = season.chip;
              const label = GROWTH_STAGES.find((s) => s.key === t.stage)?.label ?? '';
              return (
                <View
                  key={t.start}
                  className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: hue.bg }}
                  accessibilityLabel={`${t.length} day streak, ${formatDay(t.start)} to ${formatDay(t.end)}`}
                >
                  <Txt
                    variant="body"
                    style={{ color: hue.fg, fontFamily: 'Figtree_700Bold', fontSize: 14 }}
                  >
                    {t.length} days · {label}
                  </Txt>
                  <Txt variant="caption" style={{ fontSize: 11 }}>
                    {formatDay(t.start)} · grown in {season.name}
                  </Txt>
                </View>
              );
            })}
          </ScrollView>
          {trees.length > MAX_IN_SCENE ? (
            <Txt variant="caption" className="mt-2">
              The {MAX_IN_SCENE} most recent are in the scene; all {trees.length} are listed.
            </Txt>
          ) : null}
        </>
      )}
    </View>
  );
}

function ForestStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 rounded-xl py-2.5 items-center" style={{ backgroundColor: colors.bg }}>
      <Txt variant="heading" style={{ color: colors.win }}>
        {value}
      </Txt>
      <Txt variant="caption">{label}</Txt>
    </View>
  );
}
