import { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ProfileRow } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseLineReturn {
  /** Current line text, or null if not set */
  line: string | null;
  /** When the line was last reviewed/updated */
  lastReviewedAt: string | null;
  /** Whether the user is loading */
  isLoading: boolean;
  /** Save a new or updated line */
  saveLine: (newLine: string) => Promise<void>;
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Whether we are within 3 days of month-end (for Today card) */
  isMonthEndWindow: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWithin3DaysOfMonthEnd(): boolean {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diffDays = lastDayOfMonth.getDate() - now.getDate();
  return diffDays >= 0 && diffDays <= 3;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLine(): UseLineReturn {
  const { profile, isLoading, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: async (newLine: string): Promise<void> => {
      if (!profile) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          line_wont_cross: newLine,
          line_wont_cross_updated_at: now,
        })
        .eq('id', profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile?.id] });
      refreshProfile();
    },
  });

  const saveLine = useCallback(
    async (newLine: string) => {
      await mutateAsync(newLine);
    },
    [mutateAsync],
  );

  const isMonthEndWindow = useMemo(() => isWithin3DaysOfMonthEnd(), []);

  return {
    line: profile?.line_wont_cross ?? null,
    lastReviewedAt: profile?.line_wont_cross_updated_at ?? null,
    isLoading,
    saveLine,
    isSaving,
    isMonthEndWindow,
  };
}
