// =============================================================================
// Offline-first devotional hooks — extends the existing useDevotional hooks
// with SQLite caching and queued offline completions.
// =============================================================================

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  getCachedDevotionalById,
  getCachedDevotionalByDate,
  getCachedDevotionals,
  cacheDevotionals,
  queueCompletion,
  type CompletionToQueue,
} from '@/lib/offlineDb';
import { useNetworkStatus } from '@/hooks/useNetwork';
import type {
  DevotionalRow,
  DevotionalCompletionRow,
} from '@/types/database';
import type { CompleteDevotionalData } from './useDevotional';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Fetch today's devotional from Supabase (same as existing hook) */
async function fetchTodayDevotional(): Promise<DevotionalRow | null> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('devotionals')
    .select('*')
    .eq('publish_date', today)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** Fetch a batch of devotionals from Supabase */
async function fetchDevotionalsLibrary(): Promise<DevotionalRow[]> {
  const { data, error } = await supabase
    .from('devotionals')
    .select('*')
    .order('publish_date', { ascending: false })
    .limit(90);

  if (error) throw error;
  return data ?? [];
}

// ─── useTodayDevotionalOffline ─────────────────────────────────────────────────

interface UseTodayDevotionalOfflineReturn {
  devotional: DevotionalRow | null;
  completion: DevotionalCompletionRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOffline: boolean;
  completeDevotional: (data: CompleteDevotionalData) => Promise<void>;
  isCompleting: boolean;
}

export function useTodayDevotionalOffline(): UseTodayDevotionalOfflineReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();
  const today = new Date().toISOString().slice(0, 10);

  // Fetch today's devotional — online first, fallback to cache
  const {
    data: devotional,
    isLoading: isDevotionalLoading,
    isError: isDevotionalError,
    error: devotionalError,
  } = useQuery({
    queryKey: ['devotional', 'today', 'offline'],
    queryFn: async (): Promise<DevotionalRow | null> => {
      if (isConnected) {
        try {
          const serverData = await fetchTodayDevotional();
          if (serverData) {
            // Cache for offline use
            await cacheDevotionals([serverData]);
            return serverData;
          }
        } catch {
          // Network error — fall through to cache
        }
      }

      // Offline fallback
      return getCachedDevotionalByDate(today);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch today's completion if user is authenticated
  const {
    data: completion,
    isLoading: isCompletionLoading,
    isError: isCompletionError,
    error: completionError,
  } = useQuery({
    queryKey: ['devotional', 'completion', 'today', 'offline', user?.id],
    queryFn: async (): Promise<DevotionalCompletionRow | null> => {
      if (!user || !devotional) return null;

      if (isConnected) {
        try {
          const { data, error } = await supabase
            .from('devotional_completions')
            .select('*')
            .eq('user_id', user.id)
            .eq('devotional_id', devotional.id)
            .maybeSingle();

          if (error) throw error;
          return data ?? null;
        } catch {
          // Network error — no offline completion read (queue is write-only)
          return null;
        }
      }

      return null;
    },
    enabled: !!user && !!devotional,
    staleTime: 2 * 60 * 1000,
  });

  // Mutation to complete/update a devotional
  const { mutateAsync, isPending: isCompleting } = useMutation({
    mutationFn: async (data: CompleteDevotionalData): Promise<void> => {
      if (!user || !devotional) {
        throw new Error('Cannot complete devotional: user or devotional missing');
      }

      const now = new Date().toISOString();

      if (isConnected) {
        try {
          await upsertCompletionOnline(user.id, devotional.id, data);
          return;
        } catch {
          // If online write fails, queue as fallback
        }
      }

      // Offline: queue to SQLite
      const queueEntry: CompletionToQueue = {
        id: `offline_${user.id}_${devotional.id}`,
        user_id: user.id,
        devotional_id: devotional.id,
        reflection_response: data.reflection_response ?? null,
        challenge_accepted: data.challenge_accepted ?? false,
        challenge_completed: data.challenge_completed ?? false,
        prayer_duration_seconds: data.prayer_duration_seconds ?? null,
        client_updated_at: now,
      };

      await queueCompletion(queueEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['devotional', 'completion', 'today', 'offline', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['devotional', 'completions', user?.id],
      });
    },
  });

  const completeDevotional = useCallback(
    async (data: CompleteDevotionalData) => {
      await mutateAsync(data);
    },
    [mutateAsync],
  );

  return {
    devotional: devotional ?? null,
    completion: completion ?? null,
    isLoading: isDevotionalLoading || (!!user && !!devotional && isCompletionLoading),
    isError: isDevotionalError || isCompletionError,
    error: (devotionalError as Error | null) ?? (completionError as Error | null),
    isOffline: !isConnected,
    completeDevotional,
    isCompleting,
  };
}

// ─── useCompleteDevotionalOffline ──────────────────────────────────────────────

interface UseCompleteDevotionalOfflineReturn {
  completeDevotional: (devotionalId: string, data: CompleteDevotionalData) => Promise<void>;
  isCompleting: boolean;
}

/**
 * Low-level hook for completing a devotional with offline queue support.
 * Useful when you have the devotional ID but aren't within the today flow.
 */
export function useCompleteDevotionalOffline(): UseCompleteDevotionalOfflineReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      devotionalId,
      data,
    }: {
      devotionalId: string;
      data: CompleteDevotionalData;
    }): Promise<void> => {
      if (!user) {
        throw new Error('Cannot complete devotional: not authenticated');
      }

      if (isConnected) {
        try {
          await upsertCompletionOnline(user.id, devotionalId, data);
          return;
        } catch {
          // Fall through to offline queue
        }
      }

      const now = new Date().toISOString();
      const queueEntry: CompletionToQueue = {
        id: `offline_${user.id}_${devotionalId}`,
        user_id: user.id,
        devotional_id: devotionalId,
        reflection_response: data.reflection_response ?? null,
        challenge_accepted: data.challenge_accepted ?? false,
        challenge_completed: data.challenge_completed ?? false,
        prayer_duration_seconds: data.prayer_duration_seconds ?? null,
        client_updated_at: now,
      };

      await queueCompletion(queueEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotional', 'completions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['devotional', 'completion'] });
    },
  });

  const completeDevotional = useCallback(
    async (devotionalId: string, data: CompleteDevotionalData) => {
      await mutateAsync({ devotionalId, data });
    },
    [mutateAsync],
  );

  return {
    completeDevotional,
    isCompleting: isPending,
  };
}

// ─── useLibraryDevotionalsOffline ──────────────────────────────────────────────

interface UseLibraryDevotionalsOfflineReturn {
  devotionals: DevotionalRow[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOffline: boolean;
}

/**
 * Returns the full library of devotionals. Serves from the SQLite cache first,
 * then refreshes from the network in the background.
 */
export function useLibraryDevotionalsOffline(): UseLibraryDevotionalsOfflineReturn {
  const { isConnected } = useNetworkStatus();

  const {
    data: devotionals,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['devotionals', 'library', 'offline'],
    queryFn: async (): Promise<DevotionalRow[]> => {
      // Start with cache immediately
      const cached = await getCachedDevotionals();

      if (isConnected) {
        try {
          const serverData = await fetchDevotionalsLibrary();
          // Persist to cache
          await cacheDevotionals(serverData);
          return serverData;
        } catch {
          // Network error — fall back to cache
          if (cached.length > 0) return cached;
          throw new Error('Unable to load devotionals. Check your connection.');
        }
      }

      return cached;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    devotionals: devotionals ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    isOffline: !isConnected,
  };
}

// ─── Online upsert helper ──────────────────────────────────────────────────────

async function upsertCompletionOnline(
  userId: string,
  devotionalId: string,
  data: CompleteDevotionalData,
): Promise<DevotionalCompletionRow> {
  const { data: existing, error: fetchError } = await supabase
    .from('devotional_completions')
    .select('id, reflection_response, challenge_accepted, challenge_completed, prayer_duration_seconds')
    .eq('user_id', userId)
    .eq('devotional_id', devotionalId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const payload: Record<string, unknown> = {
    user_id: userId,
    devotional_id: devotionalId,
    client_updated_at: new Date().toISOString(),
  };

  if (data.reflection_response !== undefined) {
    payload.reflection_response = data.reflection_response;
  }
  if (data.challenge_accepted !== undefined) {
    payload.challenge_accepted = data.challenge_accepted;
  }
  if (data.challenge_completed !== undefined) {
    payload.challenge_completed = data.challenge_completed;
  }
  if (data.prayer_duration_seconds !== undefined) {
    payload.prayer_duration_seconds = data.prayer_duration_seconds;
  }

  if (existing) {
    // Merge with existing values
    const merged = {
      ...payload,
      reflection_response:
        data.reflection_response !== undefined
          ? data.reflection_response
          : existing.reflection_response,
      challenge_accepted:
        data.challenge_accepted !== undefined
          ? data.challenge_accepted
          : existing.challenge_accepted,
      challenge_completed:
        data.challenge_completed !== undefined
          ? data.challenge_completed
          : existing.challenge_completed,
      prayer_duration_seconds:
        data.prayer_duration_seconds !== undefined
          ? data.prayer_duration_seconds
          : existing.prayer_duration_seconds,
    };

    const { data: updated, error: updateError } = await supabase
      .from('devotional_completions')
      .update(merged)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  // Insert new row
  payload.completed_at = new Date().toISOString();
  payload.challenge_accepted = payload.challenge_accepted ?? false;
  payload.challenge_completed = payload.challenge_completed ?? false;

  const { data: inserted, error: insertError } = await supabase
    .from('devotional_completions')
    .insert(payload)
    .select('*')
    .single();

  if (insertError) throw insertError;
  return inserted;
}
