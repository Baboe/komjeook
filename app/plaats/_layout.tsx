import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function PlaatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'slide_from_right',
      }}
    />
  );
}
