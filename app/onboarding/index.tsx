import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Logo } from '../../components/Logo';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { colors, fonts, fontSize, spacing } from '../../constants/theme';

export default function Splash() {
  const router = useRouter();

  function kijkRond() {
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.wrap}>
        <View style={styles.center}>
          <Logo size={200} variant="dark" />
          <Text style={styles.tagline}>Kom je ook?</Text>
          <Text style={styles.sub}>Zeg wat je wil doen.{'\n'}Iemand doet mee.</Text>
        </View>
        <View style={styles.footer}>
          <Button title="Ja, ik kom!" variant="cream" onPress={() => router.push('/onboarding/naam')} />
          <Button
            title="Ik kijk eerst even rond"
            variant="darkGhost"
            size="md"
            onPress={kijkRond}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.aubergine },
  wrap: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  tagline: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    fontSize: fontSize.lg,
    color: 'rgba(245, 240, 232, 0.7)',
    marginTop: spacing.md,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: 'rgba(245, 240, 232, 0.5)',
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.6,
  },
  footer: { paddingBottom: spacing.lg },
});
