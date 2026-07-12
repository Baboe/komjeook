import { View } from 'react-native';
import { colors } from '../constants/theme';

type Props = {
  bars?: number;
  color?: string;
  playedColor?: string;
  progress?: number;
  height?: number;
  seed?: string;
};

function pseudoHeights(count: number, seed: string, height: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const norm = (h % 1000) / 1000;
    out.push(Math.round(height * (0.25 + norm * 0.75)));
  }
  return out;
}

export function Waveform({
  bars = 28,
  color = colors.aubergineMid,
  playedColor = colors.terracotta,
  progress = 0,
  height = 22,
  seed = 'ombaa',
}: Props) {
  const heights = pseudoHeights(bars, seed, height);
  const playedTo = Math.round(progress * bars);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: 2.5,
            height: h,
            borderRadius: 2,
            backgroundColor: i < playedTo ? playedColor : color,
            opacity: i < playedTo ? 1 : 0.55,
          }}
        />
      ))}
    </View>
  );
}
