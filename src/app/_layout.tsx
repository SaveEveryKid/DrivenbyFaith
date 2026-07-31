import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient();

function RouteGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const { session, profile, isInitializing, isProfileLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const stillResolving = isInitializing || (!!session && isProfileLoading);

  useEffect(() => {
    if (stillResolving) return;

    const segmentPath = segments as string[];
    const inAuthGroup = segmentPath[0] === '(auth)';
    const needsOnboarding = !!profile && !profile.onboarding_complete;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && needsOnboarding && segmentPath[1] !== 'onboarding') {
      router.replace('/(auth)/onboarding');
    } else if (session && !needsOnboarding && inAuthGroup) {
      router.replace('/(tabs)/today');
    }
  }, [stillResolving, session, profile, segments, router]);

  if (stillResolving) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDFBF7',
        }}
      >
        <ActivityIndicator color="#9B7343" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouteGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Settings',
              }}
            />
            <Stack.Screen
              name="situation/[id]"
              options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="reading-plan/[id]"
              options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="prayer-group/[id]"
              options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="saturday-ready"
              options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
            />
          </Stack>
        </RouteGuard>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
