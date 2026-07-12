import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth';
import { colors, fonts, radius, spacing } from '../../constants/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="label">{label}</Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

export default function Profiel() {
  const { session, profile, signOut } = useAuth();
  const router = useRouter();

  if (!session) {
    return (
      <Screen edges={['top']}>
        <View style={styles.bezoeker}>
          <Text variant="display" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
            Doe mee.
          </Text>
          <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            Maak een account aan en reageer op oproepen in jouw buurt.
          </Text>
          <Button title="Ja, ik kom!" onPress={() => router.push('/onboarding/naam')} />
          <Pressable onPress={() => router.push('/onboarding')} style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.warmGrayLight }}>
              Terug naar het begin
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={profile?.voornaam ?? '?'} uri={profile?.avatar_url} size={88} />
          <Text variant="display" style={{ marginTop: spacing.md }}>
            {profile?.voornaam ?? ''}
          </Text>
          {profile?.locatie ? (
            <Text variant="meta" style={{ marginTop: 2 }}>
              {profile.locatie}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Row label="Voornaam" value={profile?.voornaam ?? '—'} />
          <View style={styles.sep} />
          <Row label="Leeftijd" value={profile?.leeftijd ? String(profile.leeftijd) : '—'} />
          <View style={styles.sep} />
          <Row label="Locatie" value={profile?.locatie ?? '—'} />
          <View style={styles.sep} />
          <Row label="Stem" value={profile?.stem_url ? 'Opgenomen' : 'Nog niet opgenomen'} />
        </View>

        {profile?.interesses?.length ? (
          <View style={styles.card}>
            <Text variant="label" style={{ marginBottom: spacing.sm }}>
              Wat je graag doet
            </Text>
            <View style={styles.chips}>
              {profile.interesses.map((i) => (
                <View key={i} style={styles.chip}>
                  <Text variant="meta" color={colors.aubergine}>
                    {i}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Pressable onPress={signOut} style={styles.signout}>
            <Text variant="bodyMedium" color={colors.warmGray}>
              Uitloggen
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bezoeker: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  wrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 160 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.creamDark,
    marginBottom: spacing.base,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  sep: { height: 1, backgroundColor: colors.creamDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.cream, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  signout: { alignItems: 'center', paddingVertical: spacing.md },
});
