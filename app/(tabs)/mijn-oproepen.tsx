import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { BezoekerBanner } from '../../components/BezoekerBanner';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Oproep } from '../../types/db';
import { colors, radius, spacing } from '../../constants/theme';

type Section = { titel: string; items: Oproep[] };

function StatusPill({ status, reacties }: { status: Oproep['status']; reacties: number }) {
  if (status === 'vervuld') {
    return (
      <View style={[styles.pill, { backgroundColor: '#F0EAE6' }]}>
        <Text variant="meta" color={colors.terracotta} style={{ fontWeight: '500' }}>
          Jullie gaan samen
        </Text>
      </View>
    );
  }
  if (status === 'verlopen') {
    return (
      <View style={[styles.pill, { backgroundColor: colors.creamDark }]}>
        <Text variant="meta" color={colors.warmGray} style={{ fontWeight: '500' }}>
          Verlopen
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, { backgroundColor: '#E8F5EE' }]}>
      <Text variant="meta" color="#2A6B45" style={{ fontWeight: '500' }}>
        {reacties} {reacties === 1 ? 'reactie' : 'reacties'}
      </Text>
    </View>
  );
}

export default function MijnOproepen() {
  const router = useRouter();
  const { session } = useAuth();
  const [items, setItems] = useState<(Oproep & { reactie_count: number })[]>([]);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('oproepen')
      .select('*, reacties(count)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    const mapped = (data ?? []).map((o: any) => ({
      ...(o as Oproep),
      reactie_count: o.reacties?.[0]?.count ?? 0,
    }));
    setItems(mapped);
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const sections = useMemo<Section[]>(() => {
    const actief = items.filter((o) => o.status === 'actief');
    const geweest = items.filter((o) => o.status !== 'actief');
    const out: Section[] = [];
    if (actief.length) out.push({ titel: 'Actief', items: actief });
    if (geweest.length) out.push({ titel: 'Geweest', items: geweest });
    return out;
  }, [items]);

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Text variant="display">Mijn oproepen</Text>
      </View>
      <BezoekerBanner />
      <FlatList
        data={sections}
        keyExtractor={(s) => s.titel}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="label" style={styles.sectionTitle}>
              {section.titel}
            </Text>
            {section.items.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/oproep/${o.id}`)}
                style={[
                  styles.card,
                  o.status === 'vervuld' && { borderColor: colors.terracotta, backgroundColor: '#FDF8F6' },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                    {o.activiteit ?? 'Oproep'}
                  </Text>
                  <StatusPill status={o.status} reacties={(o as any).reactie_count} />
                </View>
                <Text variant="meta" style={{ marginTop: 4 }}>
                  {o.datum ? `${o.datum} · ` : ''}
                  {o.locatie}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
              Je hebt nog geen oproepen geplaatst.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.creamDark,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  empty: { paddingTop: 80, paddingHorizontal: spacing.xl },
});
