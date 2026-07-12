import { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '../constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  keyboardOffset?: number;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  style,
  keyboardOffset = 0,
}: Props) {
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        contentContainerStyle: [
          padded && styles.padded,
          { flexGrow: 1 },
          style,
        ],
        keyboardShouldPersistTaps: 'handled' as const,
        showsVerticalScrollIndicator: false,
      }
    : { style: [styles.flex, padded && styles.padded, style] };

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <Container {...containerProps}>{children}</Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg },
});
