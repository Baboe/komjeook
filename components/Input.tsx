import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, fonts, fontSize, radius, spacing } from '../constants/theme';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.warmGrayLight}
        style={[styles.input, error ? styles.inputError : undefined, style]}
      />
      {hint && !error ? (
        <Text variant="meta" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text variant="meta" color={colors.terracotta} style={styles.hint}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.base },
  label: { marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.creamDark,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textDark,
    minHeight: 54,
  },
  inputError: { borderColor: colors.terracotta },
  hint: { marginTop: spacing.xs },
});
