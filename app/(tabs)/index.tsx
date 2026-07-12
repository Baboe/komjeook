import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { OproepCard } from '../../components/OproepCard';
import { BezoekerBanner } from '../../components/BezoekerBanner';
import { MicIcon } from '../../components/Icon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Oproep } from '../../types/db';
import { colors, radius, spacing } from '../../constants/theme';

export default function Home() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const [oproepen, setOproepen] = useState<Oproep[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState(false);

  const load = useCallback(async () => {
    setFout(false);
    // Radius-filter op stadsniveau: de zelf ingestelde zoekradius bepaalt
    // welke oproepen je ziet. Zonder profiel (bezoeker) tonen we de nieuwste.
    const params =
      profile?.lat != null && profile?.lng != null
        ? { p_lat: profile.lat, p_lng: profile.lng, p_radius_km: profile.zoekradius_km ?? 25 }
        : {};
    const { data, error } = await supabase
      .rpc('feed_oproepen', params)
      .select('*, user:profiles(id, voornaam, leeftijd, locatie, avatar_url)');
    if (error) setFout(true);
    setOproepen((data as Oproep[]) ?? []);
    setLaden(false);
  }, [profile?.lat, profile?.lng, profile?.zoekradius_km]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Text variant="display">Kom je ook?</Text>
        <Text variant="body" color={colors.warmGray} style={{ marginTop: spacing.xs }}>
          {profile?.locatie && profile.lat != null
            ? `Oproepen binnen ${profile.zoekradius_km ?? 25} km van ${profile.locatie}.`
            : 'Oproepen in de buurt.'}
        </Text>
      </View>

      <FlatList
        data={oproepen}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OproepCard oproep={item} onPress={() => router.push(`/oproep/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <BezoekerBanner />
            {session ? (
              <Pressable onPress={() => router.push('/plaats')} style={styles.cta}>
                <View style={styles.ctaIcon}>
                  <MicIcon color={colors.cream} size={20} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color={colors.cream}>
                    Spreek iets in
                  </Text>
                  <Text variant="meta" color="rgba(245,240,232,0.7)">
                    Vertel wat je wil doen
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.terracotta}
          />
        }
        ListEmptyComponent={
          laden ? (
            <View style={styles.empty}>
              <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
                Even geduld...
              </Text>
            </View>
          ) : fout ? (
            <View style={styles.empty}>
              <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
                Laden lukt nu niet. Trek de lijst omlaag om het opnieuw te proberen.
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text variant="h2" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
                Nog stil hier
              </Text>
              <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
                Zin om de eerste te zijn? Tik op "Spreek iets in".
              </Text>
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.base },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  cta: {
    backgroundColor: colors.terracotta,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.terracotta,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245,240,232,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { paddingTop: 40, paddingHorizontal: spacing.xl },
});
