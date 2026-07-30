import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ConfessionRepairRow } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Use28thReturn {
  /** Whether the 28th experience is active (within the last 3 days of month) */
  isActive: boolean;
  /** Today's date string */
  today: string;
  /** The user's line they won't cross */
  line: string | null;
  /** Today's confession/repair entry if it exists */
  entry: ConfessionRepairRow | null;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether there's an error */
  isError: boolean;
  /** Save today's confession and repair step */
  saveEntry: (confession: string, repairStep: string) => Promise<void>;
  /** Whether a save is in progress */
  isSaving: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * The 28th experience is active on the last 3 calendar days of each month.
 * For February, it's the last 3 days (26th-28th in a non-leap year, 27th-29th in a leap year).
 */
function get28thActiveInfo(): { isActive: boolean; today: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // Last day of this month
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // Active on last 3 days
  const isActive = day > lastDayOfMonth - 3;

  return { isActive, today };
}

// ─── Fetch confession/repair entry for today ──────────────────────────────────

async function fetchTodayEntry(
  userId: string,
  today: string,
): Promise<ConfessionRepairRow | null> {
  const { data, error } = await supabase
    .from('confession_repair')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', today)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

// ─── Upsert confession/repair entry ───────────────────────────────────────────

async function upsertEntry(
  userId: string,
  today: string,
  confession: string,
  repairStep: string,
): Promise<ConfessionRepairRow> {
  const { data: existing } = await supabase
    .from('confession_repair')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_date', today)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('confession_repair')
      .update({ confession, repair_step: repairStep })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('confession_repair')
    .insert({
      user_id: userId,
      entry_date: today,
      confession,
      repair_step: repairStep,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function use28th(): Use28thReturn {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { isActive, today } = useMemo(() => get28thActiveInfo(), []);

  const {
    data: entry,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['confession_repair', today, profile?.id],
    queryFn: () => fetchTodayEntry(profile!.id, today),
    enabled: isActive && !!profile,
    staleTime: 2 * 60 * 1000,
  });

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: async ({
      confession,
      repairStep,
    }: {
      confession: string;
      repairStep: string;
    }) => {
      if (!profile) throw new Error('Not authenticated');
      return upsertEntry(profile.id, today, confession, repairStep);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['confession_repair', today, profile?.id],
      });
    },
  });

  const saveEntry = useCallback(
    async (confession: string, repairStep: string) => {
      await mutateAsync({ confession, repairStep });
    },
    [mutateAsync],
  );

  return {
    isActive,
    today,
    line: profile?.line_wont_cross ?? null,
    entry: entry ?? null,
    isLoading,
    isError,
    saveEntry,
    isSaving,
  };
}
