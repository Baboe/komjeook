import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Polygon } from 'react-native-svg';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { Avatar } from '../../components/Avatar';
import { Waveform } from '../../components/Waveform';
import { MapPinIcon } from '../../components/Icon';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../constants/theme';

export default function EersteBlik() {
  const router = useRouter();
  const { profile } = useAuth();
  const naam = profile?.voornaam ?? '';
  const stad = profile?.locatie ?? '';
  return (
    <Screen>
      <StepHeader step={5} total={5} canGoBack={false} />
      <View style={styles.body}>
        <Text variant="display" style={{ marginBottom: spacing.xs }}>
          {naam ? `${naam}, welkom!` : 'Welkom!'}
        </Text>
        <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.lg }}>
          Kijk, dit speelt er al bij jou in de buurt.
        </Text>

        {stad ? (
          <Text variant="meta" color={colors.warmGrayLight} style={styles.italic}>
            Al actief in {stad}
          </Text>
        ) : null}

        <View style={styles.card}>
          <View style={styles.row}>
            <Avatar name="Marc" size={36} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text variant="bodyMedium" style={{ fontSize: 13 }}>
                Marc, 49
              </Text>
              <Text variant="meta">Zaterdag · {stad || 'Amsterdam'}</Text>
            </View>
          </View>

          <View style={styles.voice}>
            <View style={styles.play}>
              <Svg width={8} height={10} viewBox="0 0 8 10">
                <Polygon points="0,0 8,5 0,10" fill={colors.cream} />
              </Svg>
            </View>
            <Waveform bars={18} height={18} seed="preview" />
            <Text variant="meta">0:09</Text>
          </View>

          <View style={styles.pill}>
            <MapPinIcon size={12} color={colors.terracotta} />
            <Text variant="meta" color={colors.terracotta} style={{ fontWeight: '500' }}>
              Noordermarkt
            </Text>
          </View>
        </View>
      </View>
      <Button title="Ik ga kijken!" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  italic: { fontStyle: 'italic', textAlign: 'center', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.creamDark,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    padding: 8,
  },
  play: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0EAE6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
