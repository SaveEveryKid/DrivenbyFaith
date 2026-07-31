import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  ReadingPlanRow,
  ReadingPlanDayRow,
  ReadingPlanProgressRow,
} from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseReadingPlansReturn {
  plans: ReadingPlanRow[];
  progress: Record<string, ReadingPlanProgressRow | null>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface ReadingPlanWithDays extends ReadingPlanRow {
  days: ReadingPlanDayRow[];
  progress: ReadingPlanProgressRow | null;
}

export interface UseReadingPlanReturn {
  plan: ReadingPlanWithDays | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface UseReadingPlanDayReturn {
  day: ReadingPlanDayRow | null;
  plan: ReadingPlanRow | null;
  progress: ReadingPlanProgressRow | null;
  isCompleted: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchAllPlans(): Promise<ReadingPlanRow[]> {
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchPlanProgress(
  userId: string,
): Promise<ReadingPlanProgressRow[]> {
  const { data, error } = await supabase
    .from('reading_plan_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data ?? [];
}

async function fetchPlanBySlug(slug: string): Promise<ReadingPlanRow | null> {
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function fetchPlanDays(planId: string): Promise<ReadingPlanDayRow[]> {
  const { data, error } = await supabase
    .from('reading_plan_days')
    .select('*')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchPlanDayById(dayId: string): Promise<ReadingPlanDayRow | null> {
  const { data, error } = await supabase
    .from('reading_plan_days')
    .select('*')
    .eq('id', dayId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function fetchPlanById(planId: string): Promise<ReadingPlanRow | null> {
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function fetchSinglePlanProgress(
  userId: string,
  planId: string,
): Promise<ReadingPlanProgressRow | null> {
  const { data, error } = await supabase
    .from('reading_plan_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function upsertPlanProgress(
  userId: string,
  planId: string,
  dayNumber: number,
): Promise<ReadingPlanProgressRow> {
  const { data: existing } = await supabase
    .from('reading_plan_progress')
    .select('id, days_completed, current_day')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .maybeSingle();

  if (existing) {
    const daysCompleted: number[] = Array.isArray(existing.days_completed)
      ? (existing.days_completed as number[])
      : [];

    if (!daysCompleted.includes(dayNumber)) {
      daysCompleted.push(dayNumber);
    }
    daysCompleted.sort((a, b) => a - b);

    // Advance current_day to the next uncompleted day
    let nextDay = 1;
    while (daysCompleted.includes(nextDay)) {
      nextDay++;
    }

    const payload = {
      days_completed: daysCompleted,
      current_day: nextDay,
      completed_at: null as string | null,
    };

    const { data: updated, error } = await supabase
      .from('reading_plan_progress')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return updated;
  }

  // First interaction — create progress record
  const payload = {
    user_id: userId,
    plan_id: planId,
    current_day: dayNumber === 1 ? 2 : 1,
    days_completed: [dayNumber],
    started_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from('reading_plan_progress')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return inserted;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useReadingPlans(): UseReadingPlansReturn {
  const { user } = useAuth();

  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    error: plansErr,
  } = useQuery({
    queryKey: ['reading-plans'],
    queryFn: fetchAllPlans,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: progressList,
    isLoading: progressLoading,
    isError: progressError,
    error: progressErr,
  } = useQuery({
    queryKey: ['reading-plans', 'progress', user?.id],
    queryFn: () => fetchPlanProgress(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const progressMap: Record<string, ReadingPlanProgressRow | null> = {};
  if (progressList && plans) {
    for (const plan of plans) {
      progressMap[plan.id] =
        progressList.find((p) => p.plan_id === plan.id) ?? null;
    }
  }

  return {
    plans: plans ?? [],
    progress: progressMap,
    isLoading: plansLoading || (!!user && progressLoading),
    isError: plansError || progressError,
    error: (plansErr as Error | null) ?? (progressErr as Error | null),
  };
}

export function useReadingPlan(slug: string): UseReadingPlanReturn {
  const { user } = useAuth();

  const {
    data: plan,
    isLoading: planLoading,
    isError: planError,
    error: planErr,
  } = useQuery({
    queryKey: ['reading-plan', slug],
    queryFn: () => fetchPlanBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: days,
    isLoading: daysLoading,
    isError: daysError,
    error: daysErr,
  } = useQuery({
    queryKey: ['reading-plan-days', plan?.id],
    queryFn: () => fetchPlanDays(plan!.id),
    enabled: !!plan,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: progress,
    isLoading: progressLoading,
    isError: progressError,
    error: progressErr,
  } = useQuery({
    queryKey: ['reading-plan-progress', plan?.id, user?.id],
    queryFn: () => fetchSinglePlanProgress(user!.id, plan!.id),
    enabled: !!user && !!plan,
    staleTime: 2 * 60 * 1000,
  });

  const result: ReadingPlanWithDays | null =
    plan ? { ...plan, days: days ?? [], progress: progress ?? null } : null;

  return {
    plan: result,
    isLoading: planLoading || (!!plan && daysLoading) || (!!plan && progressLoading),
    isError: planError || daysError || progressError,
    error: (planErr as Error | null) ?? (daysErr as Error | null) ?? (progressErr as Error | null),
  };
}

export function useReadingPlanDay(dayId: string): UseReadingPlanDayReturn {
  const { user } = useAuth();

  const {
    data: day,
    isLoading: dayLoading,
    isError: dayError,
    error: dayErr,
  } = useQuery({
    queryKey: ['reading-plan-day', dayId],
    queryFn: () => fetchPlanDayById(dayId),
    enabled: !!dayId,
    staleTime: 10 * 60 * 1000,
  });

  const planId = day?.plan_id;

  const {
    data: plan,
    isLoading: planLoading,
    isError: planError,
    error: planErr,
  } = useQuery({
    queryKey: ['reading-plan-by-id', planId],
    queryFn: () => fetchPlanById(planId!),
    enabled: !!planId,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: progress,
    isLoading: progressLoading,
    isError: progressError,
    error: progressErr,
  } = useQuery({
    queryKey: ['reading-plan-progress', planId, user?.id],
    queryFn: () => fetchSinglePlanProgress(user!.id, planId!),
    enabled: !!user && !!planId,
    staleTime: 2 * 60 * 1000,
  });

  const daysCompleted: number[] = Array.isArray(progress?.days_completed)
    ? (progress.days_completed as number[])
    : [];
  const isCompleted = day ? daysCompleted.includes(day.day_number) : false;

  return {
    day: day ?? null,
    plan: plan ?? null,
    progress: progress ?? null,
    isCompleted,
    isLoading: dayLoading || planLoading || progressLoading,
    isError: dayError || planError || progressError,
    error: (dayErr as Error | null) ?? (planErr as Error | null) ?? (progressErr as Error | null),
  };
}

export function useCompleteDay(): {
  completeDay: (planId: string, dayNumber: number) => Promise<void>;
  isCompleting: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isCompleting } = useMutation({
    mutationFn: async ({
      planId,
      dayNumber,
    }: {
      planId: string;
      dayNumber: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      return upsertPlanProgress(user.id, planId, dayNumber);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reading-plan-progress', variables.planId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['reading-plans', 'progress', user?.id],
      });
    },
  });

  const completeDay = useCallback(
    async (planId: string, dayNumber: number) => {
      await mutateAsync({ planId, dayNumber });
    },
    [mutateAsync],
  );

  return { completeDay, isCompleting };
}
