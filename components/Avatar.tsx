import { View, Image, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, fonts } from '../constants/theme';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
};

const palette = [colors.terracottaLight, colors.aubergineMid, colors.warmGray];

export function Avatar({ name, uri, size = 48 }: Props) {
  const initial = (name?.trim()?.[0] || '?').toUpperCase();
  const idx = (name?.charCodeAt(0) ?? 0) % palette.length;
  if (uri) {
    return <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette[idx] },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: size * 0.42,
          color: colors.cream,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { resizeMode: 'cover' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
