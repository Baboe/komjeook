import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { StepHeader } from '../../components/StepHeader';
import { onboardingStore, useOnboarding } from '../../lib/onboardingStore';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { geocodeStad } from '../../lib/geo';
import { registreerPush } from '../../lib/notifications';
import { colors, radius, spacing } from '../../constants/theme';

const DEV_SKIP = __DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === 'true';

// Supabase-foutmeldingen zijn Engels; vertaal naar warme, duidelijke taal.
function nlFout(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes'))
    return 'Te veel pogingen. Wacht heel even en probeer het dan opnieuw.';
  if (m.includes('expired')) return 'De code is verlopen. Vraag een nieuwe code aan.';
  if (m.includes('invalid') && (m.includes('token') || m.includes('otp')))
    return 'De code klopt niet. Controleer de cijfers en probeer het opnieuw.';
  if (m.includes('phone') || m.includes('invalid'))
    return 'Dit telefoonnummer lijkt niet te kloppen. Controleer het even.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Geen verbinding. Controleer je internet en probeer het opnieuw.';
  return 'Er ging iets mis. Probeer het opnieuw.';
}

function normalizeNL(input: string) {
  const digits = input.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  if (digits.startsWith('06') && digits.length === 10) return '+31' + digits.slice(1);
  if (digits.startsWith('0') && digits.length >= 9) return '+31' + digits.slice(1);
  return digits;
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={colors.aubergine} strokeWidth={1.75} />
      <Path d="M8 11V8a4 4 0 018 0v3" stroke={colors.aubergine} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

export default function Telefoon() {
  const router = useRouter();
  const { devLogin } = useAuth();
  const data = useOnboarding();
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'invoer' | 'code'>('invoer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wachttijd, setWachttijd] = useState(0);

  const e164 = normalizeNL(data.telefoonnummer);
  const validNumber = /^\+\d{10,15}$/.test(e164);
  const validCode = code.length === 6;

  useEffect(() => {
    if (wachttijd <= 0) return;
    const t = setInterval(() => setWachttijd((w) => w - 1), 1000);
    return () => clearInterval(t);
  }, [wachttijd > 0]);

  async function sendCode() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (err) {
      setError(nlFout(err.message));
      return;
    }
    setCode('');
    setWachttijd(60);
    setStage('code');
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
      if (err) {
        setError(nlFout(err.message));
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        // Het telefoonnummer staat alleen in Supabase Auth (auth.users),
        // nooit in de profielen die andere gebruikers kunnen zien.
        const coords = data.lat != null && data.lng != null
          ? { lat: data.lat, lng: data.lng }
          : await geocodeStad(data.locatie);
        const { error: profielErr } = await supabase.from('profiles').upsert({
          id: userData.user.id,
          voornaam: data.voornaam.trim(),
          leeftijd: Number(data.leeftijd),
          locatie: data.locatie.trim(),
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          interesses: [...data.interesses, ...(data.vrijeInteresse ? [data.vrijeInteresse.trim()] : [])],
        });
        if (profielErr) {
          setError('Je profiel opslaan lukt nu niet. Probeer het opnieuw.');
          return;
        }
        registreerPush(userData.user.id);
      }
      router.push('/onboarding/eerste-blik');
    } finally {
      setLoading(false);
    }
  }

  async function devDoorgaan() {
    if (!devLogin) return;
    await devLogin({
      id: 'dev-user-id',
      voornaam: data.voornaam || 'Demo',
      leeftijd: Number(data.leeftijd) || 45,
      locatie: data.locatie || 'Amsterdam',
      lat: data.lat,
      lng: data.lng,
      zoekradius_km: 25,
      interesses: [...data.interesses, ...(data.vrijeInteresse ? [data.vrijeInteresse] : [])],
      avatar_url: null,
      stem_url: null,
      no_show_count: 0,
      created_at: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <StepHeader
        step={4}
        total={5}
        canGoBack={stage === 'invoer'}
        onBack={() => (stage === 'code' ? setStage('invoer') : router.back())}
      />
      <View style={styles.body}>
        {stage === 'invoer' ? (
          <>
            <Text variant="display" style={{ marginBottom: spacing.xs }}>
              Bijna klaar.
            </Text>
            <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.lg }}>
              Eén kleine stap voor een veilige omgeving.
            </Text>

            <View style={styles.note}>
              <View style={{ marginTop: 1 }}>
                <LockIcon />
              </View>
              <Text variant="meta" color={colors.textMid} style={{ flex: 1, lineHeight: 18 }}>
                Je telefoonnummer gebruiken we alleen om te bevestigen dat jij het bent. We geven het nooit door
                aan anderen en tonen het niet in je profiel.
              </Text>
            </View>

            <Input
              label="Telefoonnummer"
              value={data.telefoonnummer}
              onChangeText={(t) => onboardingStore.set({ telefoonnummer: t })}
              keyboardType="phone-pad"
              placeholder="+31 6 12345678"
              autoFocus
              error={error ?? undefined}
              hint="Je ontvangt een sms met een code."
            />
          </>
        ) : (
          <>
            <Text variant="display" style={{ marginBottom: spacing.xs }}>
              Vul de code in
            </Text>
            <Text variant="body" color={colors.warmGray} style={{ marginBottom: spacing.lg }}>
              We hebben een sms gestuurd naar {e164}.
            </Text>
            <Input
              label="6-cijferige code"
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="123456"
              autoFocus
              maxLength={6}
              error={error ?? undefined}
            />
            <Pressable
              onPress={sendCode}
              disabled={wachttijd > 0 || loading}
              style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm }}
            >
              <Text
                variant="meta"
                color={wachttijd > 0 ? colors.warmGrayLight : colors.terracotta}
                style={{ fontWeight: '500' }}
              >
                {wachttijd > 0
                  ? `Geen sms ontvangen? Opnieuw sturen kan over ${wachttijd} sec.`
                  : 'Geen sms ontvangen? Stuur de code opnieuw.'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {stage === 'invoer' ? (
        <Button title="Stuur code" disabled={!validNumber} loading={loading} onPress={sendCode} />
      ) : (
        <Button title="Verder" disabled={!validCode} loading={loading} onPress={verify} />
      )}

      {DEV_SKIP ? (
        <Pressable onPress={devDoorgaan} style={styles.devSkip}>
          <Text variant="meta" color={colors.warmGrayLight}>
            Overslaan (testen)
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#F0EAE6',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  devSkip: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
});
