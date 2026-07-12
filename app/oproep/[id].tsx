import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSignedUrl } from '../../lib/storage';
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

// Foto's staan in een privé-bucket en worden via een tijdelijke URL getoond.
function Foto({ path }: { path: string }) {
  const url = useSignedUrl('fotos', path);
  if (!url) return <View style={[styles.foto, { backgroundColor: colors.creamDark }]} />;
  return <Image source={{ uri: url }} style={styles.foto} />;
}

export default function OproepScherm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [oproep, setOproep] = useState<Oproep | null>(null);
  const [reacties, setReacties] = useState<Reactie[]>([]);
  const [played, setPlayed] = useState<Record<string, boolean>>({});
  const [kiezen, setKiezen] = useState(false);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ chatId: string; other: Reactie } | null>(null);

  const isMine = session?.user?.id && oproep?.user_id === session.user.id;
  const mijnReactie = reacties.find((r) => r.user_id === session?.user?.id);

  const PROFIEL_VELDEN = 'id, voornaam, leeftijd, locatie, avatar_url, stem_url';

  const load = useCallback(async () => {
    if (!id) return;
    setFout(null);
    const [{ data: o, error: oErr }, { data: r }] = await Promise.all([
      supabase.from('oproepen').select(`*, user:profiles(${PROFIEL_VELDEN})`).eq('id', id).maybeSingle(),
      supabase.from('reacties').select(`*, user:profiles(${PROFIEL_VELDEN})`).eq('oproep_id', id).order('created_at', { ascending: true }),
    ]);
    if (oErr) setFout('Laden lukt nu niet. Trek omlaag om het opnieuw te proberen.');
    setOproep((o as Oproep) ?? null);
    setReacties((r as Reactie[]) ?? []);
    setLaden(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function kies(reactie: Reactie) {
    if (!session?.user || !oproep) return;
    setKiezen(true);
    setFout(null);
    try {
      // Eén atomaire server-side stap: reactie kiezen, rest afwijzen,
      // oproep vervullen en de chat aanmaken.
      const { data: chatId, error } = await supabase.rpc('kies_reactie', { p_reactie_id: reactie.id });
      if (error || !chatId) {
        setFout('Kiezen lukt nu niet. Probeer het opnieuw.');
        return;
      }
      setConfirm({ chatId: chatId as string, other: reactie });
      load();
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

  if (laden) {
    return (
      <Screen>
        <StepHeader />
        <Text variant="body" color={colors.warmGray}>
          Even geduld...
        </Text>
      </Screen>
    );
  }

  if (!oproep) {
    return (
      <Screen>
        <StepHeader />
        <Text variant="body" color={colors.warmGray}>
          Deze oproep bestaat niet meer.
        </Text>
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

          {oproep.foto_urls?.length ? (
            <View style={styles.fotos}>
              {oproep.foto_urls.map((p) => (
                <Foto key={p} path={p} />
              ))}
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
              {oproep.status !== 'actief' ? (
                <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
                  {oproep.user?.voornaam
                    ? `${oproep.user.voornaam} heeft iemand gevonden voor deze activiteit.`
                    : 'Deze oproep is vervuld.'}
                </Text>
              ) : mijnReactie ? (
                <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
                  Je hebt gereageerd. {oproep.user?.voornaam ?? 'De plaatser'} luistert naar de reacties.
                </Text>
              ) : (
                <Button title="Ik kom!" onPress={reageer} />
              )}
              {fout ? (
                <Text variant="meta" color={colors.terracotta} style={{ textAlign: 'center', marginTop: spacing.md }}>
                  {fout}
                </Text>
              ) : null}
            </View>
          )}
          {isMine && fout ? (
            <Text variant="meta" color={colors.terracotta} style={{ marginTop: spacing.md }}>
              {fout}
            </Text>
          ) : null}
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
              We laten {confirm?.other.user?.voornaam} weten.
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
  fotos: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  foto: { width: 84, height: 84, borderRadius: radius.md },
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
