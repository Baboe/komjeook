import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { StarIcon } from '../../components/Icon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../constants/theme';

export default function Feedback() {
  const { oproepId } = useLocalSearchParams<{ oproepId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [activiteit, setActiviteit] = useState('');
  const [sterren, setSterren] = useState(0);
  const [gekomen, setGekomen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [alGedaan, setAlGedaan] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!oproepId || !session?.user) return;
    const [{ data: o }, { data: eigen }] = await Promise.all([
      supabase.from('oproepen').select('activiteit').eq('id', oproepId).maybeSingle(),
      supabase
        .from('ontmoeting_feedback')
        .select('id')
        .eq('oproep_id', oproepId)
        .eq('user_id', session.user.id)
        .maybeSingle(),
    ]);
    setActiviteit((o as any)?.activiteit ?? '');
    setAlGedaan(!!eigen);
  }, [oproepId, session?.user]);

  useEffect(() => {
    load();
  }, [load]);

  async function verstuur() {
    if (!session?.user || !oproepId || sterren === 0 || gekomen === null) return;
    setFout(null);
    setLoading(true);
    const { error } = await supabase.from('ontmoeting_feedback').insert({
      oproep_id: oproepId,
      user_id: session.user.id,
      sterren,
      iedereen_gekomen: gekomen,
    });
    setLoading(false);
    if (error) {
      if (String(error.message).toLowerCase().includes('duplicate')) setAlGedaan(true);
      else setFout('Versturen lukt nu niet. Probeer het opnieuw.');
      return;
    }
    setKlaar(true);
  }

  if (alGedaan || klaar) {
    return (
      <Screen>
        <StepHeader />
        <View style={styles.center}>
          <Text variant="display" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
            {klaar ? 'Fijn dat je het laat weten.' : 'Je hebt dit al doorgegeven.'}
          </Text>
          <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
            {klaar ? 'Zo houden we Ombaa prettig voor iedereen.' : 'Dank je wel.'}
          </Text>
        </View>
        <Button title="Terug" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <StepHeader />
      <View style={{ flex: 1 }}>
        <Text variant="display" style={{ marginBottom: spacing.xs }}>
          Hoe was de ontmoeting?
        </Text>
        {activiteit ? (
          <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.xl }}>
            {activiteit}
          </Text>
        ) : (
          <View style={{ height: spacing.xl }} />
        )}

        <View style={styles.sterren}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setSterren(n)} hitSlop={6}>
              <StarIcon
                size={38}
                color={n <= sterren ? colors.terracotta : colors.warmGrayLight}
                filled={n <= sterren}
              />
            </Pressable>
          ))}
        </View>

        <Text variant="bodyMedium" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Is iedereen gekomen?
        </Text>
        <View style={styles.keuzeRij}>
          <Pressable
            onPress={() => setGekomen(true)}
            style={[styles.keuze, gekomen === true && styles.keuzeActief]}
          >
            <Text variant="bodyMedium" color={gekomen === true ? colors.cream : colors.textMid}>
              Ja
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGekomen(false)}
            style={[styles.keuze, gekomen === false && styles.keuzeActief]}
          >
            <Text variant="bodyMedium" color={gekomen === false ? colors.cream : colors.textMid}>
              Nee
            </Text>
          </Pressable>
        </View>

        {fout ? (
          <Text variant="meta" color={colors.terracotta} style={{ marginTop: spacing.md }}>
            {fout}
          </Text>
        ) : null}
      </View>

      <Button
        title="Versturen"
        disabled={sterren === 0 || gekomen === null}
        loading={loading}
        onPress={verstuur}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  sterren: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.lg },
  keuzeRij: { flexDirection: 'row', gap: spacing.sm },
  keuze: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.creamDark,
    backgroundColor: colors.white,
  },
  keuzeActief: { backgroundColor: colors.aubergine, borderColor: colors.aubergine },
});
