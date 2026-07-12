import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Location from 'expo-location';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { MapPinIcon } from '../../components/Icon';
import { onboardingStore, useOnboarding } from '../../lib/onboardingStore';
import { colors, radius, spacing } from '../../constants/theme';

export default function Locatie() {
  const router = useRouter();
  const data = useOnboarding();
  const [detecting, setDetecting] = useState(false);

  async function detect() {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync(pos.coords);
      const city = geo[0]?.city ?? geo[0]?.subregion ?? '';
      // We bewaren alleen de stad en de stadscoördinaten, nooit de exacte plek.
      if (city) {
        const centroid = await Location.geocodeAsync(city).catch(() => []);
        onboardingStore.set({
          locatie: city,
          lat: centroid[0]?.latitude ?? pos.coords.latitude,
          lng: centroid[0]?.longitude ?? pos.coords.longitude,
        });
      }
    } finally {
      setDetecting(false);
    }
  }

  const valid = data.locatie.trim().length >= 2;

  return (
    <Screen>
      <StepHeader step={2} total={5} />
      <View style={styles.body}>
        <Text variant="display" style={{ marginBottom: spacing.xs }}>
          Waar ben je?
        </Text>
        <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.xl }}>
          Zo vinden we activiteiten bij jou in de buurt.
        </Text>

        <Pressable onPress={detect} style={styles.detect}>
          <View style={styles.iconWrap}>
            <MapPinIcon color={colors.terracotta} size={20} />
          </View>
          <View>
            <Text variant="bodyMedium">{detecting ? 'Bezig met ophalen...' : 'Gebruik mijn locatie'}</Text>
            <Text variant="meta">Automatisch ophalen</Text>
          </View>
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text variant="meta" color={colors.warmGrayLight} style={{ marginHorizontal: spacing.sm }}>
            of
          </Text>
          <View style={styles.orLine} />
        </View>

        <Input
          label="Stad"
          value={data.locatie}
          onChangeText={(t) => onboardingStore.set({ locatie: t, lat: null, lng: null })}
          autoCapitalize="words"
          placeholder="Amsterdam"
        />
      </View>
      <Button title="Verder" disabled={!valid} onPress={() => router.push('/onboarding/interesses')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  detect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.creamDark,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EAE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  orLine: { flex: 1, height: 1, backgroundColor: colors.creamDark },
});
