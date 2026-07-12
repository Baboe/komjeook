import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Avatar } from '../../components/Avatar';
import { VoiceBubble } from '../../components/VoiceBubble';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { MapPinIcon } from '../../components/Icon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Oproep, Reactie } from '../../types/db';
import { colors, radius, spacing } from '../../constants/theme';

function tijd(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export default function OproepScherm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [oproep, setOproep] = useState<Oproep | null>(null);
  const [reacties, setReacties] = useState<Reactie[]>([]);
  const [played, setPlayed] = useState<Record<string, boolean>>({});
  const [kiezen, setKiezen] = useState(false);
  const [confirm, setConfirm] = useState<{ chatId: string; other: Reactie } | null>(null);

  const isMine = session?.user?.id && oproep?.user_id === session.user.id;

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: o }, { data: r }] = await Promise.all([
      supabase.from('oproepen').select('*, user:profiles(*)').eq('id', id).maybeSingle(),
      supabase.from('reacties').select('*, user:profiles(*)').eq('oproep_id', id).order('created_at', { ascending: true }),
    ]);
    setOproep((o as Oproep) ?? null);
    setReacties((r as Reactie[]) ?? []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function kies(reactie: Reactie) {
    if (!session?.user || !oproep) return;
    setKiezen(true);
    try {
      await supabase.from('reacties').update({ status: 'gekozen' }).eq('id', reactie.id);
      await supabase
        .from('reacties')
        .update({ status: 'niet_gekozen' })
        .eq('oproep_id', oproep.id)
        .neq('id', reactie.id);
      await supabase
        .from('oproepen')
        .update({ status: 'vervuld', gekozen_reactie_id: reactie.id })
        .eq('id', oproep.id);
      const { data: chat } = await supabase
        .from('chats')
        .insert({
          oproep_id: oproep.id,
          user_a_id: session.user.id,
          user_b_id: reactie.user_id,
        })
        .select()
        .single();
      if (chat) {
        setConfirm({ chatId: chat.id, other: reactie });
      }
    } finally {
      setKiezen(false);
    }
  }

  async function reageer() {
    if (!oproep) return;
    if (!session?.user) {
      router.push('/onboarding');
      return;
    }
    router.push({ pathname: '/plaats', params: { reactieVoor: oproep.id } });
  }

  if (!oproep) {
    return (
      <Screen>
        <StepHeader />
        <Text variant="body">Laden...</Text>
      </Screen>
    );
  }

  return (
    <>
      <Screen padded={false}>
        <View style={styles.headerWrap}>
          <StepHeader />
        </View>
        <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
          <View style={styles.row}>
            <Avatar name={oproep.user?.voornaam ?? '?'} uri={oproep.user?.avatar_url} size={48} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text variant="bodyMedium">
                {oproep.user?.voornaam}
                {oproep.user?.leeftijd ? `, ${oproep.user.leeftijd}` : ''}
              </Text>
              <Text variant="meta">
                {oproep.datum ? `${oproep.datum} · ` : ''}
                {oproep.locatie}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <VoiceBubble uri={oproep.voice_url} variant="cream" />
          </View>

          {oproep.activiteit ? (
            <View style={styles.pill}>
              <MapPinIcon size={13} color={colors.terracotta} />
              <Text variant="meta" color={colors.terracotta} style={{ fontWeight: '500' }}>
                {oproep.activiteit}
              </Text>
            </View>
          ) : null}

          {isMine ? (
            <View style={{ marginTop: spacing.xl }}>
              <Text variant="bodyMedium" style={{ marginBottom: spacing.md }}>
                Wie wil er mee?
              </Text>
              {reacties.length === 0 ? (
                <Text variant="body" color={colors.warmGray}>
                  Nog geen reacties. Je hoort het zodra iemand reageert.
                </Text>
              ) : (
                reacties.map((r) => {
                  const isPlayed = played[r.id] || r.status === 'gekozen';
                  const showKies = oproep.status === 'actief' && isPlayed;
                  return (
                    <View
                      key={r.id}
                      style={[
                        styles.reactie,
                        showKies && { borderColor: colors.terracotta, backgroundColor: '#FDF8F6' },
                      ]}
                    >
                      <View style={styles.row}>
                        <Avatar name={r.user?.voornaam ?? '?'} uri={r.user?.avatar_url} size={36} />
                        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                          <Text variant="bodyMedium" style={{ fontSize: 14 }}>
                            {r.user?.voornaam}
                            {r.user?.leeftijd ? `, ${r.user.leeftijd}` : ''}
                          </Text>
                          <Text variant="meta">{tijd(r.created_at)}</Text>
                        </View>
                      </View>
                      <View style={{ marginTop: spacing.sm }}>
                        <Pressable onPress={() => setPlayed((p) => ({ ...p, [r.id]: true }))}>
                          <VoiceBubble uri={r.voice_url} variant="cream" />
                        </Pressable>
                      </View>
                      {showKies ? (
                        <Pressable
                          disabled={kiezen}
                          onPress={() => kies(r)}
                          style={styles.kiesBtn}
                        >
                          <Text variant="bodyMedium" color={colors.cream}>
                            Leuk {r.user?.voornaam}, laten we gaan!
                          </Text>
                        </Pressable>
                      ) : r.status === 'gekozen' ? (
                        <Text variant="meta" color={colors.terracotta} style={{ marginTop: spacing.sm, fontWeight: '500' }}>
                          Jij gaat met {r.user?.voornaam}.
                        </Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={{ marginTop: spacing.xl }}>
              <Button title="Ik kom!" onPress={reageer} />
            </View>
          )}
        </ScrollView>
      </Screen>

      <Modal visible={!!confirm} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalAvatars}>
              <View style={[styles.confAvatar, { marginRight: -12, backgroundColor: colors.aubergine }]}>
                <Text style={styles.confAvatarText}>
                  {confirm?.other.user?.voornaam?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={[styles.confAvatar, { backgroundColor: colors.terracotta }]}>
                <Text style={styles.confAvatarText}>
                  {oproep.user?.voornaam?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            </View>
            <Text variant="display" style={{ textAlign: 'center', fontSize: 24 }}>
              Leuk{oproep.user?.voornaam ? `, ${oproep.user.voornaam}` : ''}!{'\n'}Jullie gaan samen.
            </Text>
            <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center', marginTop: spacing.sm }}>
              We laten {confirm?.other.user?.voornaam} weten dat je met hem of haar wil gaan.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%' }}>
              <Button
                title={`Stuur ${confirm?.other.user?.voornaam} een berichtje`}
                onPress={() => {
                  const id = confirm?.chatId;
                  setConfirm(null);
                  if (id) router.replace(`/chat/${id}`);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: spacing.xl },
  wrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0EAE6',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  reactie: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.creamDark,
    marginBottom: spacing.sm,
  },
  kiesBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.terracotta,
    paddingVertical: 11,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(44, 31, 26, 0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalAvatars: { flexDirection: 'row', marginBottom: spacing.md },
  confAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.cream,
  },
  confAvatarText: { fontFamily: 'Fraunces_300Light', fontSize: 22, color: colors.cream },
});
