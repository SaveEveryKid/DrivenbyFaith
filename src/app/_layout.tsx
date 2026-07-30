import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';

const queryClient = new QueryClient();

// ─── Auth guard — redirects based on auth state ──────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { user, isOnboarded, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      // Not authenticated — go to auth screens
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!isOnboarded) {
      // Authenticated but not onboarded — go to onboarding
      if (!inAuthGroup || segments[1] !== 'onboarding') {
        router.replace('/(auth)/onboarding');
      }
    } else {
      // Authenticated and onboarded — go to tabs
      if (inAuthGroup) {
        router.replace('/(tabs)/today');
      }
    }
  }, [user, isOnboarded, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDFBF7',
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✝</Text>
        <ActivityIndicator color="#9B7343" size="small" />
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Root layout ─────────────────────────────────────────────────────────────

function RootLayoutInner(): React.ReactElement {
  return (
    <AuthGuard>
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
          name="devotional/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </AuthGuard>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function RootLayout(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
