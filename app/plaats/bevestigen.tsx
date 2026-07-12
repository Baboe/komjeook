import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { VoiceBubble } from '../../components/VoiceBubble';
import { PlusIcon, CameraIcon } from '../../components/Icon';
import { draftStore, useDraft } from '../../lib/recording';
import { supabase } from '../../lib/supabase';
import { uploadBestand } from '../../lib/storage';
import { geocodeStad } from '../../lib/geo';
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../constants/theme';

type FieldName = 'datum' | 'locatie';

type FieldRowProps = {
  label: string;
  value: string;
  field: FieldName;
  editing: FieldName | null;
  onEdit: (field: FieldName | null) => void;
  onChange: (field: FieldName, value: string) => void;
};

// Outside component: stable identity → no unmount/remount on each keystroke
function FieldRow({ label, value, field, editing, onEdit, onChange }: FieldRowProps) {
  if (editing === field) {
    return (
      <View style={styles.field}>
        <Text variant="label" style={styles.fieldKey}>
          {label}
        </Text>
        <Input
          value={value}
          onChangeText={(t) => onChange(field, t)}
          placeholder={label}
          autoFocus
          onBlur={() => onEdit(null)}
          style={{ flex: 1 }}
        />
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <View style={{ flex: 1 }}>
        <Text variant="label" style={styles.fieldKey}>
          {label}
        </Text>
        <Text variant="bodyMedium">{value || '—'}</Text>
      </View>
      <Pressable onPress={() => onEdit(field)} hitSlop={8}>
        <Text variant="bodyMedium" color={colors.terracotta} style={{ fontSize: 13 }}>
          Wijzig
        </Text>
      </Pressable>
    </View>
  );
}

function nlPlaatsFout(e: any): string {
  const m = String(e?.message ?? e ?? '').toLowerCase();
  if (m.includes('te_veel_oproepen')) return 'Je hebt vandaag al vijf oproepen geplaatst. Morgen kan het weer.';
  if (m.includes('te_veel_reacties')) return 'Je hebt vandaag al veel gereageerd. Morgen kan het weer.';
  if (m.includes('duplicate') || m.includes('23505')) return 'Je hebt al gereageerd op deze oproep.';
  if (m.includes('network') || m.includes('fetch')) return 'Geen verbinding. Controleer je internet en probeer het opnieuw.';
  return 'Versturen lukt nu niet. Probeer het opnieuw.';
}

export default function Bevestigen() {
  const router = useRouter();
  const { reactieVoor } = useLocalSearchParams<{ reactieVoor?: string }>();
  const isReactie = typeof reactieVoor === 'string' && reactieVoor.length > 0;
  const draft = useDraft();
  const { session, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState<FieldName | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill locatie from profile if not already set
  useEffect(() => {
    if (!draft.locatie && profile?.locatie) {
      draftStore.set({ locatie: profile.locatie });
    }
  }, [profile?.locatie]);

  function handleChange(field: FieldName | 'activiteit', value: string) {
    draftStore.set({ [field]: value } as any);
  }

  async function pickFoto() {
    if (draft.fotos.length >= 3) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      draftStore.set({ fotos: [...draft.fotos, res.assets[0].uri] });
    }
  }

  // Eerste opname wordt meteen de profielstem: zo is de stem-eis vervuld
  // zonder extra drempel voor de gebruiker.
  async function zetStemAlsNodig(voicePath: string) {
    if (!profile || profile.stem_url) return;
    await supabase.from('profiles').update({ stem_url: voicePath }).eq('id', profile.id);
    await refreshProfile();
  }

  async function verstuurReactie() {
    if (!session?.user || !draft.uri || !isReactie) return;
    setError(null);
    setLoading(true);
    try {
      const userId = session.user.id;
      const voicePath = await uploadBestand('voices', `${userId}/${Date.now()}.m4a`, draft.uri, 'audio/mp4');
      const { error: insErr } = await supabase.from('reacties').insert({
        oproep_id: reactieVoor,
        user_id: userId,
        voice_url: voicePath,
      });
      if (insErr) throw insErr;
      await zetStemAlsNodig(voicePath);
      router.replace({ pathname: '/plaats/geplaatst', params: { reactie: '1' } });
    } catch (e: any) {
      setError(nlPlaatsFout(e));
      if (__DEV__) console.error('[reactie]', e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }

  async function plaats() {
    if (!session?.user || !draft.uri) return;
    setError(null);
    setLoading(true);
    try {
      const userId = session.user.id;
      const ts = Date.now();

      const voicePath = await uploadBestand('voices', `${userId}/${ts}.m4a`, draft.uri, 'audio/mp4');

      const fotoPaths: string[] = [];
      for (let i = 0; i < draft.fotos.length; i++) {
        const p = await uploadBestand('fotos', `${userId}/${ts}_${i}.jpg`, draft.fotos[i], 'image/jpeg');
        fotoPaths.push(p);
      }

      const locatie = (draft.locatie || profile?.locatie || '').trim();
      // Coördinaten op stadsniveau voor het radius-filter van anderen.
      let coords = locatie === profile?.locatie ? { lat: profile?.lat ?? null, lng: profile?.lng ?? null } : null;
      if (!coords || coords.lat == null) coords = (await geocodeStad(locatie)) ?? { lat: null, lng: null };

      const { error: insErr } = await supabase.from('oproepen').insert({
        user_id: userId,
        voice_url: voicePath,
        activiteit: draft.activiteit.trim(),
        datum: draft.datum.trim() || null,
        locatie,
        lat: coords.lat,
        lng: coords.lng,
        foto_urls: fotoPaths,
        status: 'actief',
      });
      if (insErr) throw insErr;
      await zetStemAlsNodig(voicePath);
      router.replace('/plaats/geplaatst');
    } catch (e: any) {
      setError(nlPlaatsFout(e));
      if (__DEV__) console.error('[plaats]', e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }

  const activiteitIngevuld = draft.activiteit.trim().length >= 3;

  if (isReactie) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.topbar}>
          <View style={{ width: 64 }} />
          <Text style={styles.title}>Klinkt goed?</Text>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.cancel}>
            <Text variant="bodyMedium" color={colors.warmGray} style={{ fontSize: 14 }}>
              Annuleer
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {draft.uri ? <VoiceBubble uri={draft.uri} durationSec={draft.duration} variant="cream" /> : null}

          <Text variant="body" color={colors.warmGray} style={{ marginTop: spacing.lg }}>
            Dit is wat de plaatser van de oproep te horen krijgt. Opnieuw opnemen kan ook — ga dan even
            terug.
          </Text>

          {error ? (
            <Text variant="meta" color={colors.terracotta} style={{ marginTop: spacing.md }}>
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: spacing.xl }}>
            <Button title="Stuur mijn reactie" loading={loading} onPress={verstuurReactie} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.topbar}>
        <View style={{ width: 64 }} />
        <Text style={styles.title}>Klopt dit?</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.cancel}>
          <Text variant="bodyMedium" color={colors.warmGray} style={{ fontSize: 14 }}>
            Annuleer
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {draft.uri ? <VoiceBubble uri={draft.uri} durationSec={draft.duration} variant="cream" /> : null}

        <Text variant="bodyMedium" style={{ marginTop: spacing.lg, marginBottom: spacing.sm, fontSize: 14 }}>
          Jouw activiteit:
        </Text>

        <Input
          label="Wat ga je doen?"
          value={draft.activiteit}
          onChangeText={(t) => handleChange('activiteit', t)}
          placeholder="Bijv. wandelen in het Vondelpark"
          maxLength={120}
          hint={activiteitIngevuld ? undefined : 'Schrijf kort op wat je gaat doen, dan weten mensen waarop ze reageren.'}
        />

        <View style={{ height: spacing.md }} />

        <FieldRow label="Wanneer" value={draft.datum} field="datum" editing={editing} onEdit={setEditing} onChange={handleChange} />
        <FieldRow label="Waar" value={draft.locatie || profile?.locatie || ''} field="locatie" editing={editing} onEdit={setEditing} onChange={handleChange} />

        <Text variant="meta" color={colors.warmGrayLight} style={styles.foot}>
          Klopt er iets niet? Tik op Wijzig.
        </Text>

        <View style={styles.divider} />

        <Text variant="label" style={styles.fotoLabel}>
          Foto toevoegen{' '}
          <Text variant="meta" color={colors.warmGrayLight} style={{ textTransform: 'none', letterSpacing: 0 }}>
            — optioneel, max 3
          </Text>
        </Text>

        <View style={styles.fotos}>
          {draft.fotos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.foto} />
          ))}
          {draft.fotos.length < 3 ? (
            <Pressable onPress={pickFoto} style={styles.fotoAdd}>
              {draft.fotos.length === 0 ? (
                <CameraIcon size={18} color={colors.warmGray} />
              ) : (
                <PlusIcon size={18} color={colors.warmGray} />
              )}
              <Text variant="meta" color={colors.warmGray} style={{ marginTop: 2, fontSize: 10 }}>
                Foto
              </Text>
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <Text variant="meta" color={colors.terracotta} style={{ marginTop: spacing.md }}>
            {error}
          </Text>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Button title="Plaatsen" disabled={!activiteitIngevuld} loading={loading} onPress={plaats} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: 'Fraunces_300Light', fontSize: 17, color: colors.aubergine },
  cancel: { width: 64, alignItems: 'flex-end' },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  field: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.creamDark,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fieldKey: { textTransform: 'uppercase', letterSpacing: 0.6 },
  foot: { fontStyle: 'italic', marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.creamDark, marginVertical: spacing.lg },
  fotoLabel: { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },
  fotos: { flexDirection: 'row', gap: spacing.sm },
  foto: { width: 72, height: 72, borderRadius: radius.md },
  fotoAdd: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.warmGrayLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
