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

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('oproepen')
      .select('*, user:profiles(*)')
      .eq('status', 'actief')
      .order('created_at', { ascending: false })
      .limit(50);
    setOproepen((data as Oproep[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Text variant="display">Kom je ook?</Text>
        <Text variant="body" color={colors.warmGray} style={{ marginTop: spacing.xs }}>
          Oproepen in {profile?.locatie ?? 'de buurt'}.
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
          <View style={styles.empty}>
            <Text variant="h2" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
              Nog stil hier
            </Text>
            <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
              Zin om de eerste te zijn? Tik op "Spreek iets in".
            </Text>
          </View>
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
