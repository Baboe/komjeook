import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';
import { Text } from './Text';
import { colors, fonts } from '../constants/theme';

type Props = {
  size?: number;
  variant?: 'light' | 'dark';
  withWordmark?: boolean;
};

export function Mark({ size = 80, variant = 'light' }: Props) {
  const left = variant === 'dark' ? colors.cream : colors.aubergine;
  const right = colors.terracotta;
  const heart = variant === 'dark' ? colors.terracottaLight : '#7A3D52';
  const heartOpacity = variant === 'dark' ? 0.7 : 0.75;
  return (
    <Svg width={size} height={size * (80 / 100)} viewBox="0 0 100 80">
      <Circle cx={36} cy={40} r={28} fill={left} opacity={0.9} />
      <Circle cx={64} cy={40} r={28} fill={right} opacity={0.9} />
      <Circle cx={50} cy={40} r={9} fill={heart} opacity={heartOpacity} />
    </Svg>
  );
}

export function Logo({ size = 200, variant = 'light', withWordmark = true }: Props) {
  const markSize = size * 0.42;
  const textColor = variant === 'dark' ? colors.cream : colors.aubergine;
  const fontSize = size * 0.22;
  if (!withWordmark) {
    return <Mark size={markSize} variant={variant} />;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.04 }}>
      <Mark size={markSize} variant={variant} />
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize,
          color: textColor,
          letterSpacing: -fontSize * 0.025,
          lineHeight: fontSize * 1.1,
        }}
      >
        Ombaa
      </Text>
    </View>
  );
}
