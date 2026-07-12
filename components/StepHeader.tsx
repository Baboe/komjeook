import { Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon } from './Icon';
import { colors, radius, spacing } from '../constants/theme';

type Props = {
  step?: number;
  total?: number;
  onBack?: () => void;
  canGoBack?: boolean;
};

export function StepHeader({ step, total, onBack, canGoBack = true }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable onPress={onBack ?? (() => router.back())} style={styles.back} hitSlop={12}>
            <ChevronLeftIcon />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        {step && total ? (
          <View style={styles.dots}>
            {Array.from({ length: total }).map((_, i) => {
              const state = i + 1 < step ? 'done' : i + 1 === step ? 'active' : 'pending';
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    state === 'active' && styles.dotActive,
                    state === 'done' && styles.dotDone,
                  ]}
                />
              );
            })}
          </View>
        ) : null}
        <View style={styles.back} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
  },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.creamDark },
  dotDone: { backgroundColor: colors.aubergineMid },
  dotActive: { width: 16, borderRadius: 3, backgroundColor: colors.terracotta },
});
