import { Pressable, StyleSheet, ActivityIndicator, View, PressableProps } from 'react-native';
import { ReactNode } from 'react';
import { Text } from './Text';
import { colors, fonts, fontSize, radius, spacing } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'cream' | 'darkGhost';
type Size = 'lg' | 'md';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  iconLeft,
  iconRight,
  fullWidth = true,
  style,
  ...rest
}: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'cream' && styles.cream,
        variant === 'darkGhost' && styles.darkGhost,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' },
        typeof style === 'function' ? null : style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.white : colors.aubergine} />
        ) : (
          <>
            {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
            <Text
              style={[
                styles.text,
                variant === 'primary' && { color: colors.white },
                variant === 'secondary' && { color: colors.aubergine },
                variant === 'ghost' && { color: colors.aubergine },
                variant === 'cream' && { color: colors.aubergine },
                variant === 'darkGhost' && { color: 'rgba(245,240,232,0.65)' },
              ]}
            >
              {title}
            </Text>
            {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  lg: { paddingVertical: 14, paddingHorizontal: spacing.xl, minHeight: 54 },
  md: { paddingVertical: 10, paddingHorizontal: spacing.lg, minHeight: 44 },
  primary: { backgroundColor: colors.terracotta },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.aubergine },
  ghost: { backgroundColor: colors.creamDark },
  cream: { backgroundColor: colors.cream },
  darkGhost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  text: { fontFamily: fonts.bodyMedium, fontSize: fontSize.md, lineHeight: fontSize.md * 1.2, letterSpacing: 0.1 },
});
