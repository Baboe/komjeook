import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Polygon } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mark } from '../../components/Logo';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { Waveform } from '../../components/Waveform';
import { useAuth } from '../../lib/auth';
import { useDraft, draftStore } from '../../lib/recording';
import { colors, radius, spacing } from '../../constants/theme';

export default function Geplaatst() {
  const router = useRouter();
  const { reactie } = useLocalSearchParams<{ reactie?: string }>();
  const isReactie = reactie === '1';
  const { profile } = useAuth();
  const draft = useDraft();
  const naam = profile?.voornaam ?? '';

  if (isReactie) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.wrap}>
          <View style={styles.center}>
            <Mark size={60} />
            <Text variant="display" style={styles.title}>
              Je reactie is verstuurd{naam ? `, ${naam}` : ''}!
            </Text>
            <Text variant="body" color={colors.warmGray} style={styles.sub}>
              Je hoort het zodra er gekozen is.
            </Text>
          </View>
          <Button
            title="Terug naar de oproepen"
            onPress={() => {
              draftStore.reset();
              router.dismissAll();
              router.replace('/(tabs)');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.wrap}>
        <View style={styles.center}>
          <Mark size={60} />
          <Text variant="display" style={styles.title}>
            Je oproep staat live{naam ? `, ${naam}` : ''}!
          </Text>
          <Text variant="body" color={colors.warmGray} style={styles.sub}>
            We laten je weten zodra iemand reageert.
          </Text>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Avatar name={naam || 'S'} size={30} uri={profile?.avatar_url} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text variant="bodyMedium" style={{ fontSize: 13 }}>
                  {naam}
                  {profile?.leeftijd ? `, ${profile.leeftijd}` : ''}
                </Text>
                <Text variant="meta" style={{ fontSize: 11 }}>
                  {draft.datum || 'Binnenkort'} · {draft.locatie || profile?.locatie || ''}
                </Text>
              </View>
            </View>
            <View style={styles.voice}>
              <View style={styles.play}>
                <Svg width={7} height={9} viewBox="0 0 7 9">
                  <Polygon points="0,0 7,4.5 0,9" fill={colors.cream} />
                </Svg>
              </View>
              <Waveform bars={14} height={16} seed={draft.uri ?? 'just'} />
              <Text variant="meta" style={{ fontSize: 11 }}>
                {Math.floor(draft.duration / 60)}:{String(draft.duration % 60).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        <Button
          title="Kom je ook?"
          onPress={() => {
            draftStore.reset();
            router.dismissAll();
            router.replace('/(tabs)');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  wrap: { flex: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { textAlign: 'center', marginTop: spacing.md },
  sub: { textAlign: 'center', maxWidth: 280, marginBottom: spacing.lg },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.creamDark,
    gap: spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  play: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
