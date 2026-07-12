import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { BezoekerBanner } from '../../components/BezoekerBanner';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { Avatar } from '../../components/Avatar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { colors, fonts, spacing } from '../../constants/theme';

type Row = {
  chat_id: string;
  other_id: string;
  other_name: string;
  other_leeftijd: number | null;
  other_avatar: string | null;
  activiteit: string;
  datum: string;
  laatste: string;
  preview: string;
  unread: boolean;
};

function tijd(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return 'Gisteren';
  const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  if (diff < 7 * 86400) return days[d.getDay()];
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export default function Berichten() {
  const router = useRouter();
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const uid = session.user.id;
    const { data } = await supabase
      .from('chats')
      .select(
        'id, oproep:oproepen(activiteit, datum), user_a:profiles!chats_user_a_id_fkey(id, voornaam, leeftijd, avatar_url), user_b:profiles!chats_user_b_id_fkey(id, voornaam, leeftijd, avatar_url), laatste_bericht_at, berichten:berichten(tekst, voice_url, created_at, user_id, gelezen)',
      )
      .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`)
      .order('laatste_bericht_at', { ascending: false });

    const mapped: Row[] = (data ?? []).map((c: any) => {
      const other = c.user_a?.id === uid ? c.user_b : c.user_a;
      const msgs = [...(c.berichten ?? [])].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const lastMsg = msgs.slice(-1)[0];
      const prefix = lastMsg?.user_id === uid ? 'Jij: ' : '';
      const text = lastMsg?.tekst ?? (lastMsg?.voice_url ? 'Spraakbericht' : '');
      const unread = msgs.some((m: any) => m.user_id !== uid && !m.gelezen);
      return {
        chat_id: c.id,
        other_id: other?.id,
        other_name: other?.voornaam ?? 'Onbekend',
        other_leeftijd: other?.leeftijd ?? null,
        other_avatar: other?.avatar_url ?? null,
        activiteit: c.oproep?.activiteit ?? '',
        datum: c.oproep?.datum ?? '',
        laatste: c.laatste_bericht_at,
        preview: `${prefix}${text}`,
        unread,
      };
    });
    setRows(mapped);
  }, [session?.user]);

  // Herladen bij elke focus: gelezen-status klopt dan na het sluiten van een chat.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Text variant="display">Berichten</Text>
      </View>
      <BezoekerBanner />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.chat_id}
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.row, item.unread && styles.rowUnread, index === 0 && styles.rowFirst]}
            onPress={() => router.push(`/chat/${item.chat_id}`)}
          >
            <View>
              <Avatar name={item.other_name} uri={item.other_avatar} size={44} />
              {item.unread ? <View style={styles.dot} /> : null}
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.rowTop}>
                <Text variant="bodyMedium" style={{ fontSize: 14 }}>
                  {item.other_name}{item.other_leeftijd ? `, ${item.other_leeftijd}` : ''}
                </Text>
                <Text variant="meta" color={colors.warmGray}>{tijd(item.laatste)}</Text>
              </View>
              {item.activiteit ? (
                <Text variant="meta" color={colors.terracotta} numberOfLines={1} style={{ fontWeight: '500', marginTop: 1 }}>
                  {item.activiteit}{item.datum ? ` · ${item.datum}` : ''}
                </Text>
              ) : null}
              <Text
                numberOfLines={1}
                color={item.unread ? colors.textMid : colors.warmGray}
                style={{ fontFamily: item.unread ? fonts.bodyMedium : fonts.body, fontSize: 12, marginTop: 2 }}
              >
                {item.preview}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body" color={colors.warmGray} style={{ textAlign: 'center' }}>
              Nog geen gesprekken. Reageer op een oproep om er een te beginnen.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  list: { paddingBottom: 100, backgroundColor: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamDark,
    backgroundColor: colors.white,
  },
  rowFirst: { borderTopWidth: 1, borderTopColor: colors.creamDark },
  rowUnread: { backgroundColor: '#FDF8F6' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: colors.terracotta,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  empty: { paddingTop: 80, paddingHorizontal: spacing.xl },
});
