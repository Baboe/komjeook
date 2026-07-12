import { useEffect, useRef, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { PlayIcon, PauseIcon } from './Icon';
import { Text } from './Text';
import { Waveform } from './Waveform';
import { colors, radius, spacing } from '../constants/theme';

type Props = {
  uri: string;
  durationSec?: number;
  variant?: 'cream' | 'self' | 'plain';
};

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function VoiceBubble({ uri, durationSec = 0, variant = 'cream' }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationSec * 1000);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function toggle() {
    if (!soundRef.current) {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setPosition(status.positionMillis);
        if (status.durationMillis) setDuration(status.durationMillis);
        if (status.didJustFinish) {
          setPlaying(false);
          setPosition(0);
        } else {
          setPlaying(status.isPlaying);
        }
      });
      setPlaying(true);
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  }

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const remaining = (duration - position) / 1000;

  const isSelf = variant === 'self';
  const wrapBg = isSelf ? colors.aubergine : variant === 'plain' ? 'transparent' : colors.cream;
  const playBg = colors.terracotta;
  const textColor = isSelf ? colors.cream : colors.warmGray;
  const waveColor = isSelf ? 'rgba(245,240,232,0.4)' : colors.aubergineMid;

  return (
    <View style={[styles.wrap, { backgroundColor: wrapBg }]}>
      <Pressable onPress={toggle} style={[styles.play, { backgroundColor: playBg }]} hitSlop={8}>
        {playing ? <PauseIcon color={colors.cream} size={14} /> : <PlayIcon color={colors.cream} size={14} />}
      </Pressable>
      <Waveform progress={progress} color={waveColor} playedColor={playBg} seed={uri} />
      <Text variant="meta" color={textColor} style={styles.time}>
        {fmt(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: spacing.md,
    minHeight: 52,
  },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontVariant: ['tabular-nums'], minWidth: 30, textAlign: 'right' },
});
