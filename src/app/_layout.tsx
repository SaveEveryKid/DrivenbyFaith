import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient();

export default function RootLayout(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
        </Stack>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
