import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { sm2, type RecallQuality } from '@/lib/sm2';
import type { MemoryVerseRow } from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseMemoryVersesReturn {
  verses: MemoryVerseRow[];
  dueCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface UseMemoryVerseReturn {
  verse: MemoryVerseRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface AddMemoryVerseInput {
  reference: string;
  verseText: string;
  translation?: string;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchMemoryVerses(userId: string): Promise<MemoryVerseRow[]> {
  const { data, error } = await supabase
    .from('memory_verses')
    .select('*')
    .eq('user_id', userId)
    .order('next_review_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchMemoryVerseById(
  userId: string,
  verseId: string,
): Promise<MemoryVerseRow | null> {
  const { data, error } = await supabase
    .from('memory_verses')
    .select('*')
    .eq('id', verseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function insertMemoryVerse(
  userId: string,
  input: AddMemoryVerseInput,
): Promise<MemoryVerseRow> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('memory_verses')
    .insert({
      user_id: userId,
      reference: input.reference,
      verse_text: input.verseText,
      translation: input.translation ?? 'ESV',
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      next_review_date: today,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function updateMemoryVerseReview(
  verse: MemoryVerseRow,
  quality: RecallQuality,
): Promise<MemoryVerseRow> {
  const result = sm2(
    quality,
    verse.ease_factor,
    verse.interval_days,
    verse.repetitions,
  );

  const { data, error } = await supabase
    .from('memory_verses')
    .update({
      ease_factor: result.easeFactor,
      interval_days: result.interval,
      repetitions: result.repetitions,
      next_review_date: result.nextDate,
    })
    .eq('id', verse.id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// ─── Review Mode Helpers ─────────────────────────────────────────────────────

export { sm2 } from '@/lib/sm2';
export type { RecallQuality } from '@/lib/sm2';

export type ReviewMode = 'read' | 'firstLetters' | 'fillBlanks' | 'typeFromMemory';

export function getFirstLetters(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join(' ');
}

export function getFillBlanks(text: string): { display: (string | null)[]; blanks: number[] } {
  const words = text.split(/\s+/);
  // Blank out ~40% of words, randomly selecting but ensuring at least 1 blank
  const blankCount = Math.max(1, Math.floor(words.length * 0.4));
  const indices = new Set<number>();

  while (indices.size < blankCount) {
    const idx = Math.floor(Math.random() * words.length);
    indices.add(idx);
  }

  const display: (string | null)[] = words.map((word, i) =>
    indices.has(i) ? null : word,
  );
  const blanks: number[] = Array.from(indices).sort((a, b) => a - b);

  return { display, blanks };
}

export function getNextReviewMode(current: ReviewMode): ReviewMode {
  const cycle: ReviewMode[] = ['read', 'firstLetters', 'fillBlanks', 'typeFromMemory'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useMemoryVerses(): UseMemoryVersesReturn {
  const { user } = useAuth();

  const {
    data: verses,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['memory-verses', user?.id],
    queryFn: () => fetchMemoryVerses(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const dueCount = (verses ?? []).filter(
    (v) => v.next_review_date <= today,
  ).length;

  return {
    verses: verses ?? [],
    dueCount,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useMemoryVerse(id: string): UseMemoryVerseReturn {
  const { user } = useAuth();

  const {
    data: verse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['memory-verse', id, user?.id],
    queryFn: () => fetchMemoryVerseById(user!.id, id),
    enabled: !!user && !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    verse: verse ?? null,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useAddMemoryVerse(): {
  addVerse: (input: AddMemoryVerseInput) => Promise<MemoryVerseRow>;
  isAdding: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isAdding } = useMutation({
    mutationFn: async (input: AddMemoryVerseInput) => {
      if (!user) throw new Error('Not authenticated');
      return insertMemoryVerse(user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-verses', user?.id] });
    },
  });

  const addVerse = useCallback(
    async (input: AddMemoryVerseInput) => {
      return mutateAsync(input);
    },
    [mutateAsync],
  );

  return { addVerse, isAdding };
}

export function useReviewMemoryVerse(): {
  review: (verse: MemoryVerseRow, quality: RecallQuality) => Promise<MemoryVerseRow>;
  isReviewing: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isReviewing } = useMutation({
    mutationFn: async ({
      verse,
      quality,
    }: {
      verse: MemoryVerseRow;
      quality: RecallQuality;
    }) => {
      return updateMemoryVerseReview(verse, quality);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-verses', user?.id] });
    },
  });

  const review = useCallback(
    async (verse: MemoryVerseRow, quality: RecallQuality) => {
      return mutateAsync({ verse, quality });
    },
    [mutateAsync],
  );

  return { review, isReviewing };
}
