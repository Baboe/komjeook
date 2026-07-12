import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { onboardingStore, useOnboarding } from '../../lib/onboardingStore';
import { colors, radius, spacing } from '../../constants/theme';

const OPTIES = [
  'Wandelen',
  'Films',
  'Muziek',
  'Markt',
  'Wijn',
  'Museum',
  'Natuur',
  'Boeken',
  'Theater',
  'Eten',
  'Fietsen',
  'Concert',
  'Tuinieren',
  'Vrijwilligerswerk',
  'Sport',
  'Dansen',
];

export default function Interesses() {
  const router = useRouter();
  const data = useOnboarding();

  function toggle(item: string) {
    const has = data.interesses.includes(item);
    onboardingStore.set({
      interesses: has ? data.interesses.filter((i) => i !== item) : [...data.interesses, item],
    });
  }

  return (
    <Screen scroll>
      <StepHeader step={3} total={5} />
      <Text variant="display" style={{ marginBottom: spacing.xs }}>
        Wat vind jij leuk?
      </Text>
      <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.xl }}>
        Tik aan wat bij je past.
      </Text>

      <View style={styles.chips}>
        {OPTIES.map((opt) => {
          const active = data.interesses.includes(opt);
          return (
            <Pressable key={opt} onPress={() => toggle(opt)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && { color: colors.terracotta }]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Input
          label="Iets anders?"
          value={data.vrijeInteresse}
          onChangeText={(t) => onboardingStore.set({ vrijeInteresse: t })}
          placeholder="Comiccon, zeilen..."
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button title="Verder" onPress={() => router.push('/onboarding/telefoon')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.creamDark,
  },
  chipActive: { backgroundColor: '#F0EAE6', borderColor: colors.terracotta },
  chipText: { color: colors.textMid, fontSize: 14 },
});
