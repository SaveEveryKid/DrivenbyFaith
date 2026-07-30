import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { ProfileRow } from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | undefined>(undefined);

// ─── Profile fetch function ──────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile row yet (shouldn't happen with the trigger, but handle it)
      return null;
    }
    throw error;
  }

  return data;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ── Session lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsInitialized(true);
    });

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Invalidate profile query when session changes
        if (newSession?.user) {
          queryClient.invalidateQueries({
            queryKey: ['profile', newSession.user.id],
          });
        } else {
          // Clear all queries on sign out
          queryClient.clear();
        }
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [queryClient]);

  // ── Refresh session when app returns to foreground ────────────────────────

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        supabase.auth.getSession().then(({ data: { session: refreshed } }) => {
          if (refreshed) {
            setSession(refreshed);
            setUser(refreshed.user);
          }
        });
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSub.remove();
    };
  }, []);

  // ── Profile query (only when user is authenticated) ───────────────────────

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minute stale time for profile
  });

  const isOnboarded = profile?.onboarding_complete ?? false;

  // ── Auth methods ──────────────────────────────────────────────────────────

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { error: normalizeAuthError(error) };
      }
      return { error: null };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { error: normalizeAuthError(error) };
      }
      return { error: null };
    },
    [],
  );

  const signInWithApple = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      Alert.alert('Sign in failed', normalizeAuthError(error));
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      Alert.alert('Sign in failed', normalizeAuthError(error));
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out failed', normalizeAuthError(error));
    }
  }, []);

  const deleteAccount = useCallback(async (): Promise<void> => {
    try {
      // Invoke the Edge Function to delete the auth user (cascades to all data)
      const { error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error) {
        Alert.alert(
          'Could not delete account',
          'Please try again. If the problem continues, contact support.',
        );
        return;
      }

      // Sign out locally
      await supabase.auth.signOut();
      queryClient.clear();
    } catch {
      Alert.alert(
        'Could not delete account',
        'Please try again. If the problem continues, contact support.',
      );
    }
  }, [queryClient]);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'drivenbyfaith://reset-password',
        },
      );

      if (error) {
        return { error: normalizeAuthError(error) };
      }
      return { error: null };
    },
    [],
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    await refetchProfile();
  }, [refetchProfile]);

  // ── Memoized context value ────────────────────────────────────────────────

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      profile: profile ?? null,
      isLoading: !isInitialized || (!!user && isProfileLoading),
      isOnboarded,
      signInWithEmail,
      signUpWithEmail,
      signInWithApple,
      signInWithGoogle,
      signOut,
      deleteAccount,
      sendPasswordReset,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      isInitialized,
      isProfileLoading,
      isOnboarded,
      signInWithEmail,
      signUpWithEmail,
      signInWithApple,
      signInWithGoogle,
      signOut,
      deleteAccount,
      sendPasswordReset,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeAuthError(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Email or password is incorrect.';
    case 'User already registered':
      return 'An account with this email already exists.';
    case 'Email rate limit exceeded':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}
