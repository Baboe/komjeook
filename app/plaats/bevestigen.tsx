import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
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
import { useAuth } from '../../lib/auth';
import { colors, radius, spacing } from '../../constants/theme';

type FieldName = 'activiteit' | 'datum' | 'locatie';

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

export default function Bevestigen() {
  const router = useRouter();
  const draft = useDraft();
  const { session, profile } = useAuth();
  const [editing, setEditing] = useState<FieldName | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill locatie from profile if not already set
  useEffect(() => {
    if (!draft.locatie && profile?.locatie) {
      draftStore.set({ locatie: profile.locatie });
    }
  }, [profile?.locatie]);

  function handleChange(field: FieldName, value: string) {
    draftStore.set({ [field]: value } as any);
  }

  async function pickFoto() {
    if (draft.fotos.length >= 3) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      draftStore.set({ fotos: [...draft.fotos, res.assets[0].uri] });
    }
  }

  async function uploadFile(bucket: string, path: string, uri: string, contentType: string) {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const { error } = await supabase.storage.from(bucket).upload(path, bytes.buffer, { contentType });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function plaats() {
    if (!session?.user || !draft.uri) return;
    setError(null);
    setLoading(true);
    try {
      const userId = session.user.id;
      const ts = Date.now();

      const voiceUrl = await uploadFile('voices', `${userId}/${ts}.m4a`, draft.uri, 'audio/mp4');

      const fotoUrls: string[] = [];
      for (let i = 0; i < draft.fotos.length; i++) {
        const url = await uploadFile('fotos', `${userId}/${ts}_${i}.jpg`, draft.fotos[i], 'image/jpeg');
        fotoUrls.push(url);
      }

      const locatie = draft.locatie || profile?.locatie || '';
      const { error: insErr } = await supabase.from('oproepen').insert({
        user_id: userId,
        voice_url: voiceUrl,
        activiteit: draft.activiteit || null,
        datum: draft.datum || null,
        locatie,
        foto_urls: fotoUrls,
        status: 'actief',
      });
      if (insErr) throw insErr;
      router.replace('/plaats/geplaatst');
    } catch (e: any) {
      setError('Plaatsen lukt nu niet. Probeer het opnieuw.');
      if (__DEV__) console.error('[plaats]', e?.message ?? e);
    } finally {
      setLoading(false);
    }
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

        <FieldRow label="Activiteit" value={draft.activiteit} field="activiteit" editing={editing} onEdit={setEditing} onChange={handleChange} />
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
          <Button title="Plaatsen" loading={loading} onPress={plaats} />
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
