import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  DevotionalRow,
  DevotionalCompletionRow,
} from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CompleteDevotionalData {
  reflection_response?: string | null;
  challenge_accepted?: boolean;
  challenge_completed?: boolean;
  prayer_duration_seconds?: number | null;
}

interface UseTodayDevotionalReturn {
  devotional: DevotionalRow | null;
  completion: DevotionalCompletionRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  completeDevotional: (data: CompleteDevotionalData) => Promise<void>;
  isCompleting: boolean;
}

interface UseDevotionalCompletionsReturn {
  completions: DevotionalCompletionRow[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface DevotionalStreak {
  currentStreak: number;
  longestStreak: number;
  completedDays: string[];
}

interface UseDevotionalStreakReturn {
  streak: DevotionalStreak | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetches the devotional for today's date from the server.
 * Uses TODAY's UTC date, so the app always matches the server date.
 */
async function fetchTodayDevotional(): Promise<DevotionalRow | null> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC

  const { data, error } = await supabase
    .from('devotionals')
    .select('*')
    .eq('publish_date', today)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

/**
 * Fetches completion records for the authenticated user.
 */
async function fetchCompletions(userId: string): Promise<DevotionalCompletionRow[]> {
  const { data, error } = await supabase
    .from('devotional_completions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Upserts a devotional completion record.
 */
async function upsertCompletion(
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

  if (fetchError) {
    throw fetchError;
  }

  const payload: Record<string, unknown> = {
    user_id: userId,
    devotional_id: devotionalId,
  };

  if (data.reflection_response !== undefined) {
    payload.reflection_response = data.reflection_response;
    payload.client_updated_at = new Date().toISOString();
  }

  if (data.challenge_accepted !== undefined) {
    payload.challenge_accepted = data.challenge_accepted;
    payload.client_updated_at = new Date().toISOString();
  }

  if (data.challenge_completed !== undefined) {
    payload.challenge_completed = data.challenge_completed;
    payload.client_updated_at = new Date().toISOString();
  }

  if (data.prayer_duration_seconds !== undefined) {
    payload.prayer_duration_seconds = data.prayer_duration_seconds;
    payload.client_updated_at = new Date().toISOString();
  }

  if (existing) {
    // Merge with existing values — don't overwrite what isn't being set
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

  // Insert new row — set completed_at on first write
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

/**
 * Computes a user's devotional streak from an array of completion dates.
 */
function computeStreak(completions: DevotionalCompletionRow[]): DevotionalStreak {
  const completedDaysSet = new Set(
    completions.map((c) => c.completed_at.slice(0, 10)),
  );
  const completedDays = Array.from(completedDaysSet).sort();

  if (completedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completedDays: [] };
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Current streak: walk backwards from today (or yesterday if today not yet completed)
  let currentStreak = 0;
  const hasToday = completedDaysSet.has(today);
  const startFrom = hasToday ? today : yesterday;

  const current = new Date(startFrom);
  while (completedDaysSet.has(current.toISOString().slice(0, 10))) {
    currentStreak++;
    current.setDate(current.getDate() - 1);
  }

  // Longest streak: walk through all dates
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = completedDays
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diff =
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / 86400000;
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    longestStreak,
    completedDays,
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useTodayDevotional(): UseTodayDevotionalReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch today's devotional
  const {
    data: devotional,
    isLoading: isDevotionalLoading,
    isError: isDevotionalError,
    error: devotionalError,
  } = useQuery({
    queryKey: ['devotional', 'today'],
    queryFn: fetchTodayDevotional,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch today's completion if user is authenticated
  const {
    data: completion,
    isLoading: isCompletionLoading,
    isError: isCompletionError,
    error: completionError,
  } = useQuery({
    queryKey: ['devotional', 'completion', 'today', user?.id],
    queryFn: async () => {
      if (!user || !devotional) return null;
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('devotional_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('devotional_id', devotional.id)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user && !!devotional,
    staleTime: 2 * 60 * 1000,
  });

  // Mutation to complete/update a devotional
  const { mutateAsync, isPending: isCompleting } = useMutation({
    mutationFn: async (data: CompleteDevotionalData) => {
      if (!user || !devotional) {
        throw new Error('Cannot complete devotional: user or devotional missing');
      }
      return upsertCompletion(user.id, devotional.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['devotional', 'completion', 'today', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['devotional', 'completions', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['devotional', 'streak', user?.id],
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
    completeDevotional,
    isCompleting,
  };
}

export function useDevotionalCompletions(): UseDevotionalCompletionsReturn {
  const { user } = useAuth();

  const {
    data: completions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['devotional', 'completions', user?.id],
    queryFn: () => fetchCompletions(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  return {
    completions: completions ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useDevotionalStreak(): UseDevotionalStreakReturn {
  const { user } = useAuth();

  const {
    data: streak,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['devotional', 'streak', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const completions = await fetchCompletions(user.id);
      return computeStreak(completions);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    streak: streak ?? null,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useDevotionalById(id: string): {
  devotional: DevotionalRow | null;
  completion: DevotionalCompletionRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { user } = useAuth();

  const {
    data: devotional,
    isLoading: isDevotionalLoading,
    isError: isDevotionalError,
    error: devotionalError,
  } = useQuery({
    queryKey: ['devotional', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devotionals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  const {
    data: completion,
    isLoading: isCompletionLoading,
    isError: isCompletionError,
    error: completionError,
  } = useQuery({
    queryKey: ['devotional', 'completion', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('devotional_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('devotional_id', id)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user && !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    devotional: devotional ?? null,
    completion: completion ?? null,
    isLoading: isDevotionalLoading || (!!user && isCompletionLoading),
    isError: isDevotionalError || isCompletionError,
    error: (devotionalError as Error | null) ?? (completionError as Error | null),
  };
}
