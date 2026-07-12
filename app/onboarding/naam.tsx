import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { onboardingStore, useOnboarding } from '../../lib/onboardingStore';
import { colors, spacing } from '../../constants/theme';

export default function Naam() {
  const router = useRouter();
  const data = useOnboarding();
  const valid = data.voornaam.trim().length >= 2 && Number(data.leeftijd) >= 18 && Number(data.leeftijd) <= 110;

  return (
    <Screen>
      <StepHeader step={1} total={5} />
      <View style={styles.body}>
        <Text variant="display" style={{ marginBottom: spacing.xs }}>
          Hoi, wie ben jij?
        </Text>
        <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.xl }}>
          Twee dingen, meer niet.
        </Text>
        <Input
          label="Voornaam"
          value={data.voornaam}
          onChangeText={(t) => onboardingStore.set({ voornaam: t })}
          autoCapitalize="words"
          placeholder="Sandra"
          autoFocus
        />
        <Input
          label="Leeftijd"
          value={data.leeftijd}
          onChangeText={(t) => onboardingStore.set({ leeftijd: t.replace(/[^0-9]/g, '') })}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="52"
        />
      </View>
      <Button title="Verder" disabled={!valid} onPress={() => router.push('/onboarding/locatie')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
