import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Fraunces_300Light, Fraunces_300Light_Italic } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../constants/theme';

function RootNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const hasCompletedProfile = Boolean(profile?.voornaam);

    if (session && !hasCompletedProfile && !inOnboarding) {
      router.replace('/onboarding/naam');
    } else if (session && hasCompletedProfile && inOnboarding) {
      router.replace('/(tabs)');
    } else if (!session && !inOnboarding && !inTabs) {
      // Bezoekers landen op de tabs, niet op onboarding
      router.replace('/(tabs)');
    }
  }, [session, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="plaats" options={{ presentation: 'modal' }} />
      <Stack.Screen name="oproep/[id]" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_300Light,
    Fraunces_300Light_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }} />
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
