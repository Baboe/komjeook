import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '../../components/Text';
import { MicIcon } from '../../components/Icon';
import { draftStore } from '../../lib/recording';
import { colors, radius, spacing } from '../../constants/theme';

export default function Microfoon() {
  const router = useRouter();
  // Als 'reactieVoor' is meegegeven nemen we een reactie op een oproep op,
  // anders een nieuwe eigen oproep.
  const { reactieVoor } = useLocalSearchParams<{ reactieVoor?: string }>();
  const isReactie = typeof reactieVoor === 'string' && reactieVoor.length > 0;
  const recRef = useRef<Audio.Recording | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Audio.requestPermissionsAsync();
    return () => {
      recRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!recording) {
      pulse.setValue(1);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording, pulse]);

  async function start() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recRef.current = recording;
      setRecording(true);
      setSeconds(0);
    } catch {}
  }

  async function stop() {
    try {
      const r = recRef.current;
      if (!r) return;
      await r.stopAndUnloadAsync();
      const uri = r.getURI();
      recRef.current = null;
      setRecording(false);
      if (uri && seconds >= 1) {
        draftStore.set({ uri, duration: seconds });
        router.push(
          isReactie
            ? { pathname: '/plaats/bevestigen', params: { reactieVoor } }
            : '/plaats/bevestigen',
        );
      }
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.topbar}>
        <View style={{ width: 64 }} />
        <Text style={styles.title}>{isReactie ? 'Jouw reactie' : 'Nieuwe activiteit'}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.cancel}>
          <Text variant="bodyMedium" color={colors.warmGray} style={{ fontSize: 14 }}>
            Annuleer
          </Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        {recording ? (
          <Text variant="bodyMedium" color={colors.terracotta} style={{ fontSize: 14 }}>
            Opname bezig — {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </Text>
        ) : (
          <Text variant="bodyMedium" style={{ fontSize: 15 }}>
            {isReactie ? 'Laat even van je horen' : 'Wat ga jij doen?'}
          </Text>
        )}

        <Animated.View style={{ transform: [{ scale: pulse }], marginVertical: spacing.xl }}>
          <View style={styles.shadowOuter}>
            <View style={styles.shadowInner}>
              <Pressable
                onPressIn={start}
                onPressOut={stop}
                style={[styles.mic, recording && styles.micActive]}
              >
                {recording ? (
                  <View style={styles.stop} />
                ) : (
                  <MicIcon color={colors.cream} size={36} strokeWidth={1.8} />
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Text variant="meta" color={colors.warmGray} style={{ fontWeight: '500' }}>
          {recording ? 'Loslaten om te stoppen' : 'Houd ingedrukt om in te spreken'}
        </Text>
      </View>

      <View style={styles.tip}>
        <Text variant="meta" color={colors.textMid} style={styles.tipText}>
          {isReactie
            ? '"Leuk! Ik ben Marc en ik ga graag mee."'
            : '"Zaterdag naar de Noordermarkt, wie heeft er zin?"'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: 'Fraunces_300Light', fontSize: 17, color: colors.aubergine },
  cancel: { width: 64, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  shadowOuter: {
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: 'rgba(196, 97, 74, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowInner: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(196, 97, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mic: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActive: { backgroundColor: '#8B3D2A' },
  stop: { width: 22, height: 22, borderRadius: 3, backgroundColor: colors.cream },
  tip: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: '#F0EAE6',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tipText: { fontStyle: 'italic', fontSize: 13, lineHeight: 20 },
});
