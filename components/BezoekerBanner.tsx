import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Text } from './Text';
import { colors, fonts, radius, spacing } from '../constants/theme';

export function BezoekerBanner() {
  const { session } = useAuth();
  const router = useRouter();

  if (session) return null;

  return (
    <Pressable onPress={() => router.push('/onboarding')} style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Je kijkt als bezoeker.</Text>
        <Text style={styles.sub}>Meld je aan om mee te doen.</Text>
      </View>
      <View style={styles.btn}>
        <Text style={styles.btnText}>Aanmelden</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.aubergine,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.cream,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(245,240,232,0.65)',
    marginTop: 1,
  },
  btn: {
    backgroundColor: colors.terracotta,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  btnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.cream,
  },
});
