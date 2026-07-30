import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { DealDebriefRow } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DebriefInput {
  units_sold?: number | null;
  ups_taken?: number | null;
  went_well?: string;
  went_wrong?: string;
  where_i_saw_god?: string;
  where_i_fell_short?: string;
  who_i_served?: string;
  tomorrow_intention?: string;
  gratitude?: string;
  mood?: number | null;
}

export interface UseDebriefsReturn {
  debriefs: DealDebriefRow[];
  /** Debriefs grouped by month for SectionList: { title: 'August 2026', data: [...] } */
  sections: { title: string; data: DealDebriefRow[] }[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => void;
}

export interface UseDebriefDetailReturn {
  debrief: DealDebriefRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  updateDebrief: (data: DebriefInput) => Promise<void>;
  deleteDebrief: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseCreateDebriefReturn {
  createDebrief: (data: DebriefInput) => Promise<DealDebriefRow>;
  isCreating: boolean;
}

export interface UseDebriefSearchReturn {
  searchDebriefs: (query: string) => DealDebriefRow[];
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function fetchDebriefs(userId: string): Promise<DealDebriefRow[]> {
  const { data, error } = await supabase
    .from('deal_debriefs')
    .select('*')
    .eq('user_id', userId)
    .order('debrief_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function fetchDebriefById(debateId: string): Promise<DealDebriefRow | null> {
  const { data, error } = await supabase
    .from('deal_debriefs')
    .select('*')
    .eq('id', debateId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

// ─── Group debriefs by month ──────────────────────────────────────────────────

function groupByMonth(debriefs: DealDebriefRow[]): { title: string; data: DealDebriefRow[] }[] {
  const groups = new Map<string, DealDebriefRow[]>();

  for (const d of debriefs) {
    const date = new Date(d.debrief_date);
    const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const existing = groups.get(key) ?? [];
    existing.push(d);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

// ─── Mood to Psalm mapping ────────────────────────────────────────────────────

export function getMoodVerse(mood: number): { reference: string; text: string } {
  if (mood <= 2) {
    return {
      reference: 'Psalm 13:5-6',
      text: 'But I have trusted in your steadfast love; my heart shall rejoice in your salvation. I will sing to the Lord, because he has dealt bountifully with me.',
    };
  }
  if (mood === 3) {
    return {
      reference: 'Psalm 23:1-3',
      text: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
    };
  }
  return {
    reference: 'Psalm 100:4-5',
    text: 'Enter his gates with thanksgiving, and his courts with praise. Give thanks to him; bless his name. For the Lord is good; his steadfast love endures forever.',
  };
}

// ─── Export to text ───────────────────────────────────────────────────────────

export function debriefToText(debrief: DealDebriefRow): string {
  const date = new Date(debrief.debrief_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [
    `Deal Debrief — ${date}`,
    '',
  ];

  if (debrief.units_sold != null) lines.push(`Units Sold: ${debrief.units_sold}`);
  if (debrief.ups_taken != null) lines.push(`Ups Taken: ${debrief.ups_taken}`);
  if (debrief.went_well) lines.push(`\nWhat Went Well:\n${debrief.went_well}`);
  if (debrief.went_wrong) lines.push(`\nWhat Went Wrong:\n${debrief.went_wrong}`);
  if (debrief.where_i_saw_god) lines.push(`\nWhere I Saw God:\n${debrief.where_i_saw_god}`);
  if (debrief.where_i_fell_short) lines.push(`\nWhere I Fell Short:\n${debrief.where_i_fell_short}`);
  if (debrief.who_i_served) lines.push(`\nWho I Served:\n${debrief.who_i_served}`);
  if (debrief.tomorrow_intention) lines.push(`\nTomorrow's Intention:\n${debrief.tomorrow_intention}`);
  if (debrief.gratitude) lines.push(`\nGratitude:\n${debrief.gratitude}`);
  if (debrief.mood != null) lines.push(`\nMood: ${'●'.repeat(debrief.mood)}${'○'.repeat(5 - debrief.mood)}`);

  return lines.join('\n');
}

// ─── Hook: useDebriefs ────────────────────────────────────────────────────────

export function useDebriefs(): UseDebriefsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: debriefs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['debriefs', user?.id],
    queryFn: () => fetchDebriefs(user!.id),
    enabled: !!user,
  });

  const sections = useMemo(() => groupByMonth(debriefs), [debriefs]);

  return {
    debriefs,
    sections,
    isLoading,
    isError,
    error: error as Error | null,
    refresh: refetch,
  };
}

// ─── Hook: useDebriefDetail ───────────────────────────────────────────────────

export function useDebriefDetail(id: string): UseDebriefDetailReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: debrief = null,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['debriefs', id],
    queryFn: () => fetchDebriefById(id),
    enabled: !!id,
  });

  const { mutateAsync: updateMutate, isPending: isUpdating } = useMutation({
    mutationFn: async (data: DebriefInput) => {
      const { error: updateError } = await supabase
        .from('deal_debriefs')
        .update({ ...data, client_updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debriefs', id] });
      queryClient.invalidateQueries({ queryKey: ['debriefs', user?.id] });
    },
  });

  const { mutateAsync: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const { error: deleteError } = await supabase
        .from('deal_debriefs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debriefs', user?.id] });
      queryClient.removeQueries({ queryKey: ['debriefs', id] });
    },
  });

  return {
    debrief,
    isLoading,
    isError,
    error: error as Error | null,
    updateDebrief: updateMutate,
    deleteDebrief: deleteMutate,
    isUpdating,
    isDeleting,
  };
}

// ─── Hook: useCreateDebrief ───────────────────────────────────────────────────

export function useCreateDebrief(): UseCreateDebriefReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isCreating } = useMutation({
    mutationFn: async (data: DebriefInput): Promise<DealDebriefRow> => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().slice(0, 10);

      const { data: created, error } = await supabase
        .from('deal_debriefs')
        .insert({
          user_id: user.id,
          debrief_date: today,
          units_sold: data.units_sold ?? null,
          ups_taken: data.ups_taken ?? null,
          went_well: data.went_well ?? null,
          went_wrong: data.went_wrong ?? null,
          where_i_saw_god: data.where_i_saw_god ?? null,
          where_i_fell_short: data.where_i_fell_short ?? null,
          who_i_served: data.who_i_served ?? null,
          tomorrow_intention: data.tomorrow_intention ?? null,
          gratitude: data.gratitude ?? null,
          mood: data.mood ?? null,
          client_updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debriefs', user?.id] });
    },
  });

  return {
    createDebrief: mutateAsync,
    isCreating,
  };
}

// ─── Hook: useDebriefSearch ───────────────────────────────────────────────────

export function useDebriefSearch(debriefs: DealDebriefRow[]): UseDebriefSearchReturn {
  const searchDebriefs = useCallback(
    (query: string): DealDebriefRow[] => {
      if (!query.trim()) return debriefs;

      const lower = query.toLowerCase();
      return debriefs.filter((d) => {
        return (
          (d.went_well?.toLowerCase().includes(lower) ?? false) ||
          (d.went_wrong?.toLowerCase().includes(lower) ?? false) ||
          (d.gratitude?.toLowerCase().includes(lower) ?? false) ||
          (d.where_i_saw_god?.toLowerCase().includes(lower) ?? false) ||
          (d.where_i_fell_short?.toLowerCase().includes(lower) ?? false) ||
          (d.who_i_served?.toLowerCase().includes(lower) ?? false) ||
          (d.tomorrow_intention?.toLowerCase().includes(lower) ?? false)
        );
      });
    },
    [debriefs],
  );

  return { searchDebriefs };
}
