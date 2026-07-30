import { useCallback, useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { SituationRow, SituationSaveRow } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SituationCategory =
  | 'customer'
  | 'management'
  | 'coworker'
  | 'self'
  | 'family'
  | 'money'
  | 'ethics';

export const ALL_CATEGORIES: SituationCategory[] = [
  'customer',
  'management',
  'coworker',
  'self',
  'family',
  'money',
  'ethics',
];

export const CATEGORY_LABELS: Record<SituationCategory, string> = {
  customer: 'Customers',
  management: 'Management',
  coworker: 'Coworkers',
  self: 'Yourself',
  family: 'Family',
  money: 'Money',
  ethics: 'Ethics',
};

export interface UseSituationsReturn {
  situations: SituationRow[];
  savedIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: SituationCategory | null;
  setActiveCategory: (c: SituationCategory | null) => void;
  toggleSave: (situationId: string) => void;
  isToggling: boolean;
  refresh: () => void;
}

export interface UseSituationDetailReturn {
  situation: SituationRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSaved: boolean;
  toggleSave: () => void;
  isToggling: boolean;
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

async function fetchSituations(): Promise<SituationRow[]> {
  const { data, error } = await supabase
    .from('situations')
    .select('*')
    .order('title');

  if (error) throw error;
  return data ?? [];
}

async function fetchSituationBySlug(slug: string): Promise<SituationRow | null> {
  const { data, error } = await supabase
    .from('situations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function fetchSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('situation_saves')
    .select('situation_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((s) => s.situation_id);
}

// ─── Hook: useSituations ──────────────────────────────────────────────────────

export function useSituations(): UseSituationsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQueryState] = useState('');
  const [activeCategory, setActiveCategory] = useState<SituationCategory | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(q);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const {
    data: situations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['situations'],
    queryFn: fetchSituations,
    staleTime: 5 * 60 * 1000,
  });

  const { data: savedSituationIds = [] } = useQuery({
    queryKey: ['situation_saves', user?.id],
    queryFn: () => fetchSavedIds(user!.id),
    enabled: !!user,
  });

  const savedIds = new Set(savedSituationIds);

  const { mutate: toggleSaveMutate, isPending: isToggling } = useMutation({
    mutationFn: async (situationId: string) => {
      if (!user) throw new Error('Not authenticated');

      if (savedIds.has(situationId)) {
        await supabase
          .from('situation_saves')
          .delete()
          .eq('user_id', user.id)
          .eq('situation_id', situationId);
      } else {
        await supabase
          .from('situation_saves')
          .insert({
            user_id: user.id,
            situation_id: situationId,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['situation_saves', user?.id] });
    },
  });

  const toggleSave = useCallback(
    (situationId: string) => {
      toggleSaveMutate(situationId);
    },
    [toggleSaveMutate],
  );

  // Filter situations client-side
  let filtered = situations;

  if (activeCategory) {
    filtered = filtered.filter((s) => s.category === activeCategory);
  }

  if (debouncedSearch.trim()) {
    const lower = debouncedSearch.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(lower) ||
        s.situation_body.toLowerCase().includes(lower),
    );
  }

  return {
    situations: filtered,
    savedIds,
    isLoading,
    isError,
    error: error as Error | null,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    toggleSave,
    isToggling,
    refresh: refetch,
  };
}

// ─── Hook: useSituationDetail ─────────────────────────────────────────────────

export function useSituationDetail(slug: string): UseSituationDetailReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: situation = null,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['situations', slug],
    queryFn: () => fetchSituationBySlug(slug),
    enabled: !!slug,
  });

  const { data: savedSituationIds = [] } = useQuery({
    queryKey: ['situation_saves', user?.id],
    queryFn: () => fetchSavedIds(user!.id),
    enabled: !!user,
  });

  const isSaved = situation ? savedSituationIds.includes(situation.id) : false;

  const { mutate: toggleSaveMutate, isPending: isToggling } = useMutation({
    mutationFn: async () => {
      if (!user || !situation) throw new Error('Not authenticated');

      if (isSaved) {
        await supabase
          .from('situation_saves')
          .delete()
          .eq('user_id', user.id)
          .eq('situation_id', situation.id);
      } else {
        await supabase
          .from('situation_saves')
          .insert({
            user_id: user.id,
            situation_id: situation.id,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['situation_saves', user?.id] });
    },
  });

  return {
    situation,
    isLoading,
    isError,
    error: error as Error | null,
    isSaved,
    toggleSave: toggleSaveMutate,
    isToggling,
  };
}
