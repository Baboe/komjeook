import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors, fonts, fontSize } from '../constants/theme';

type Variant = 'hero' | 'display' | 'h1' | 'h2' | 'body' | 'bodyMedium' | 'meta' | 'label';

type Props = TextProps & { variant?: Variant; color?: string };

const variantStyles = StyleSheet.create({
  hero: {
    fontFamily: fonts.display,
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero * 1.1,
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 1.15,
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  h1: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * 1.2,
    color: colors.textDark,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.25,
    color: colors.textDark,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    color: colors.textMid,
  },
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    color: colors.textDark,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    color: colors.warmGray,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    color: colors.warmGray,
  },
});

export function Text({ variant = 'body', color, style, ...rest }: Props) {
  return <RNText {...rest} style={[variantStyles[variant], color ? { color } : null, style]} />;
}
