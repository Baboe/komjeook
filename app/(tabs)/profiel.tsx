import { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { VoiceBubble } from '../../components/VoiceBubble';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, spacing } from '../../constants/theme';

const RADIUS_OPTIES = [10, 25, 50, 100];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="label">{label}</Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

export default function Profiel() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [radiusBezig, setRadiusBezig] = useState(false);
  const [verwijderBezig, setVerwijderBezig] = useState(false);

  async function zetRadius(km: number) {
    if (!profile || radiusBezig) return;
    setRadiusBezig(true);
    await supabase.from('profiles').update({ zoekradius_km: km }).eq('id', profile.id);
    await refreshProfile();
    setRadiusBezig(false);
  }

  function verwijderAccount() {
    Alert.alert(
      'Account verwijderen',
      'Je profiel, oproepen, reacties, gesprekken en opnames worden definitief verwijderd. Dit kan niet ongedaan worden gemaakt.',
      [
        { text: 'Toch houden', style: 'cancel' },
        {
          text: 'Definitief verwijderen',
          style: 'destructive',
          onPress: async () => {
            setVerwijderBezig(true);
            const { error } = await supabase.rpc('verwijder_account');
            setVerwijderBezig(false);
            if (error) {
              Alert.alert('Dat lukt nu niet', 'Probeer het later opnieuw.');
              return;
            }
            await supabase.auth.signOut().catch(() => {});
            await signOut().catch(() => {});
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }

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
          <Row label="Telefoonnummer" value={session.user?.phone ? `+${session.user.phone.replace(/^\+/, '')}` : '—'} />
          <Text variant="meta" color={colors.warmGrayLight} style={{ marginTop: 2 }}>
            Alleen jij ziet je telefoonnummer. Anderen nooit.
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="label" style={{ marginBottom: spacing.sm }}>
            Jouw stem
          </Text>
          {profile?.stem_url ? (
            <VoiceBubble uri={profile.stem_url} variant="cream" />
          ) : (
            <Text variant="body" color={colors.warmGray}>
              Nog niet opgenomen. Je eerste oproep of reactie wordt vanzelf jouw stem.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text variant="label" style={{ marginBottom: spacing.xs }}>
            Zoekradius
          </Text>
          <Text variant="meta" color={colors.warmGray} style={{ marginBottom: spacing.sm }}>
            Hoe ver mogen oproepen van {profile?.locatie ?? 'jouw stad'} zijn?
          </Text>
          <View style={styles.radiusRij}>
            {RADIUS_OPTIES.map((km) => {
              const actief = (profile?.zoekradius_km ?? 25) === km;
              return (
                <Pressable
                  key={km}
                  onPress={() => zetRadius(km)}
                  disabled={radiusBezig}
                  style={[styles.radiusKnop, actief && styles.radiusKnopActief]}
                >
                  <Text variant="meta" color={actief ? colors.cream : colors.textMid} style={{ fontWeight: '500' }}>
                    {km} km
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
          <Pressable
            onPress={() => Linking.openURL('https://ombaa.com/privacy')}
            style={styles.signout}
          >
            <Text variant="bodyMedium" color={colors.warmGray}>
              Privacyverklaring
            </Text>
          </Pressable>
          <Pressable onPress={signOut} style={styles.signout}>
            <Text variant="bodyMedium" color={colors.warmGray}>
              Uitloggen
            </Text>
          </Pressable>
          <Pressable onPress={verwijderAccount} disabled={verwijderBezig} style={styles.signout}>
            <Text variant="bodyMedium" color={colors.terracotta}>
              {verwijderBezig ? 'Bezig met verwijderen...' : 'Account verwijderen'}
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
  radiusRij: { flexDirection: 'row', gap: spacing.sm },
  radiusKnop: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.creamDark,
    backgroundColor: colors.cream,
  },
  radiusKnopActief: { backgroundColor: colors.aubergine, borderColor: colors.aubergine },
  chip: { backgroundColor: colors.cream, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  signout: { alignItems: 'center', paddingVertical: spacing.md },
});
