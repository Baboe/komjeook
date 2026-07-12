import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { VoiceBubble } from './VoiceBubble';
import { MapPinIcon } from './Icon';
import { colors, radius, spacing } from '../constants/theme';
import { Oproep } from '../types/db';

type Props = {
  oproep: Oproep;
  onPress?: () => void;
};

function tijdGeleden(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  return `${Math.floor(diff / 86400)} dag geleden`;
}

export function OproepCard({ oproep, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Avatar name={oproep.user?.voornaam ?? 'O'} size={42} uri={oproep.user?.avatar_url} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text variant="bodyMedium">
            {oproep.user?.voornaam ?? 'Iemand'}
            {oproep.user?.leeftijd ? `, ${oproep.user.leeftijd}` : ''}
          </Text>
          <Text variant="meta">
            {oproep.datum ? `${oproep.datum} · ` : ''}
            {oproep.locatie} · {tijdGeleden(oproep.created_at)}
          </Text>
        </View>
      </View>

      <VoiceBubble uri={oproep.voice_url} variant="cream" />

      {oproep.activiteit ? (
        <View style={styles.pill}>
          <MapPinIcon size={14} color={colors.terracotta} />
          <Text variant="meta" color={colors.terracotta} style={{ fontWeight: '500' }}>
            {oproep.activiteit}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.creamDark,
    marginBottom: spacing.base,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0EAE6',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
});
