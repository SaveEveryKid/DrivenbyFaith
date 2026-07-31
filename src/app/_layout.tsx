import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { SyncProvider } from '@/lib/SyncProvider';
import { isBiometricLockEnabled, authenticate } from '@/lib/biometrics';

const queryClient = new QueryClient();

// ─── Deep link configuration ──────────────────────────────────────────────────

const linking = {
  prefixes: ['drivenbyfaith://'],
  config: {
    screens: {
      'situation/[slug]': 'situation/:slug',
    },
  },
};

// ─── Biometric gate — shows on app foreground when biometric lock is enabled ──

function BiometricGate({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const checkAndAuthenticate = useCallback(async () => {
    if (!user || isAuthLoading) return;

    try {
      const enabled = await isBiometricLockEnabled();
      if (!enabled) {
        setIsLocked(false);
        return;
      }

      setIsLocked(true);
      setIsAuthenticating(true);

      const success = await authenticate();
      if (success) {
        setIsLocked(false);
      }
      // If not successful, stay locked — user must retry
    } catch {
      // If biometric is unavailable, unlock gracefully
      setIsLocked(false);
    } finally {
      setIsAuthenticating(false);
    }
  }, [user, isAuthLoading]);

  // ── Authenticate on mount (first app open) ────────────────────────────────

  useEffect(() => {
    void checkAndAuthenticate();
  }, [checkAndAuthenticate]);

  // ── Authenticate on foreground return ──────────────────────────────────────

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        void checkAndAuthenticate();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [checkAndAuthenticate]);

  // ── Render lock screen ─────────────────────────────────────────────────────

  if (isLocked) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDFBF7',
          padding: 32,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✝</Text>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 20,
            color: '#3C3C3C',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Driven by Faith
        </Text>
        {isAuthenticating ? (
          <ActivityIndicator color="#9B7343" size="small" />
        ) : (
          <Text
            onPress={() => void checkAndAuthenticate()}
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 16,
              color: '#9B7343',
              textDecorationLine: 'underline',
            }}
          >
            Unlock
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Auth guard — redirects based on auth state ──────────────────────────────

function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
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
      if (
        !inAuthGroup ||
        (segments.length > 1 && segments[1] !== 'onboarding')
      ) {
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
      <BiometricGate>
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
            name="settings/notifications"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Notifications',
            }}
          />
          <Stack.Screen
            name="settings/security"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Security',
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="line"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'The Line',
            }}
          />
          <Stack.Screen
            name="28th"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'The 28th',
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
          <Stack.Screen
            name="debrief/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'New Debrief',
            }}
          />
          <Stack.Screen
            name="debrief/index"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="debrief/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Debrief',
            }}
          />
          <Stack.Screen
            name="situation/index"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="situation/[slug]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Situation',
            }}
          />
          <Stack.Screen
            name="saturday-ready/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Saturday Ready',
            }}
          />
          <Stack.Screen
            name="plans/index"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Reading Plans',
            }}
          />
          <Stack.Screen
            name="plans/[slug]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Reading Plan',
            }}
          />
          <Stack.Screen
            name="plans/day/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Day',
            }}
          />
          <Stack.Screen
            name="memory/index"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Memory Verses',
            }}
          />
          <Stack.Screen
            name="memory/review/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Review Verse',
            }}
          />
          <Stack.Screen
            name="prayer/groups"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="prayer/groups/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'New Group',
            }}
          />
          <Stack.Screen
            name="prayer/groups/join"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Join Group',
            }}
          />
          <Stack.Screen
            name="prayer/groups/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
            }}
          />
          <Stack.Screen
            name="prayer/requests/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'New Request',
            }}
          />
          <Stack.Screen
            name="discussions/index"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="discussions/[category]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
            }}
          />
          <Stack.Screen
            name="discussions/[category]/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'New Thread',
            }}
          />
          <Stack.Screen
            name="discussions/thread/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
            }}
          />
        </Stack>
      </BiometricGate>
    </AuthGuard>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function RootLayout(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SyncProvider>
            <RootLayoutInner />
          </SyncProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
