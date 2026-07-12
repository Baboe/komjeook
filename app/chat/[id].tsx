import { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../components/Text';
import { Avatar } from '../../components/Avatar';
import { VoiceBubble } from '../../components/VoiceBubble';
import { ChevronLeftIcon } from '../../components/Icon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Bericht } from '../../types/db';
import { colors, fonts, fontSize, radius, spacing } from '../../constants/theme';

type Other = { id: string; voornaam: string; avatar_url: string | null };

function SendArrow() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1 7h12M7 1l6 6-6 6"
        stroke={colors.cream}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [tekst, setTekst] = useState('');
  const [other, setOther] = useState<Other | null>(null);
  const [context, setContext] = useState<{ activiteit: string; datum: string }>({ activiteit: '', datum: '' });
  const [hasSystem, setHasSystem] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!id || !session?.user) return;
    const uid = session.user.id;
    const { data: chat } = await supabase
      .from('chats')
      .select(
        'user_a_id, user_b_id, oproep:oproepen(activiteit, datum, user_id), user_a:profiles!chats_user_a_id_fkey(id, voornaam, avatar_url), user_b:profiles!chats_user_b_id_fkey(id, voornaam, avatar_url)',
      )
      .eq('id', id)
      .maybeSingle();
    if (chat) {
      const c: any = chat;
      const o: Other = c.user_a?.id === uid ? c.user_b : c.user_a;
      setOther(o);
      setContext({ activiteit: c.oproep?.activiteit ?? '', datum: c.oproep?.datum ?? '' });
      setHasSystem(c.oproep?.user_id === uid);
    }
    const { data: msgs } = await supabase
      .from('berichten')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });
    setBerichten((msgs as Bericht[]) ?? []);
  }, [id, session?.user]);

  useEffect(() => {
    load();
    if (!id) return;
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'berichten', filter: `chat_id=eq.${id}` },
        (payload) => setBerichten((prev) => [...prev, payload.new as Bericht]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  async function stuur() {
    if (!tekst.trim() || !session?.user || !id) return;
    const t = tekst.trim();
    setTekst('');
    await supabase.from('berichten').insert({
      chat_id: id,
      user_id: session.user.id,
      tekst: t,
    });
    await supabase.from('chats').update({ laatste_bericht_at: new Date().toISOString() }).eq('id', id);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeftIcon size={22} />
        </Pressable>
        {other ? (
          <>
            <Avatar name={other.voornaam} uri={other.avatar_url} size={36} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontSize: 14 }}>
                {other.voornaam}
              </Text>
              {context.activiteit ? (
                <Text variant="meta" color={colors.terracotta} style={{ fontWeight: '500' }} numberOfLines={1}>
                  {context.activiteit}
                  {context.datum ? ` · ${context.datum}` : ''}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <FlatList
          ref={listRef}
          data={berichten}
          keyExtractor={(b) => b.id}
          ListHeaderComponent={
            hasSystem && other ? (
              <View style={styles.system}>
                <Text variant="meta" color={colors.textMid} style={{ textAlign: 'center' }}>
                  Je kiest {other.voornaam} om samen{context.activiteit ? ` naar ${context.activiteit}` : ''} te gaan.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const mine = item.user_id === session?.user?.id;
            if (item.voice_url) {
              return (
                <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
                  <View style={{ minWidth: 220, maxWidth: 300 }}>
                    <VoiceBubble uri={item.voice_url} variant={mine ? 'self' : 'cream'} />
                  </View>
                </View>
              );
            }
            return (
              <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
                <View style={[styles.textBubble, mine ? styles.mine : styles.theirs]}>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.base,
                      lineHeight: fontSize.base * 1.4,
                      color: mine ? colors.cream : colors.textDark,
                    }}
                  >
                    {item.tekst}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput
            value={tekst}
            onChangeText={setTekst}
            placeholder="Typ een bericht..."
            placeholderTextColor={colors.warmGrayLight}
            style={styles.input}
            multiline
          />
          <Pressable onPress={stuur} disabled={!tekst.trim()} style={[styles.send, !tekst.trim() && { opacity: 0.45 }]}>
            <SendArrow />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamDark,
    gap: 4,
  },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  system: { backgroundColor: '#F0EAE6', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  bubbleWrap: { marginVertical: 3, flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  textBubble: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.lg, maxWidth: '80%' },
  mine: { backgroundColor: colors.aubergine, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.creamDark },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.creamDark,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textDark,
    maxHeight: 120,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
