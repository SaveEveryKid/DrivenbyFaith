import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  SaturdayReadyRow,
  SaturdayReadyResponseRow,
} from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseSaturdayReadyReturn {
  saturdayReady: SaturdayReadyRow | null;
  response: SaturdayReadyResponseRow | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /** Whether the user can access Saturday Ready right now (after Friday 6pm) */
  isActive: boolean;
  /** How much time remains until release (if not yet active, null otherwise) */
  countdownLabel: string | null;
}

export interface UseSaturdayReadyResponseReturn {
  saveResponse: (data: {
    commitmentsSelected: string[];
    notes: string | null;
  }) => Promise<void>;
  isSaving: boolean;
}

// ─── Timezone helpers ───────────────────────────────────────────────────────

/**
 * Returns the current date in the given IANA timezone as 'YYYY-MM-DD'.
 * Falls back to local system time if the timezone string is unrecognized.
 */
function getDateInTimezone(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    // If the timezone is invalid, fall back to local
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns the current day of week and hour for the given IANA timezone.
 */
function getDayAndHourInTimezone(timezone: string): { day: number; hour: number } {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now);

    let day = -1;
    let hour = -1;
    for (const part of parts) {
      if (part.type === 'weekday') {
        const map: Record<string, number> = {
          Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
        };
        day = map[part.value] ?? -1;
      }
      if (part.type === 'hour') {
        hour = parseInt(part.value, 10);
      }
    }
    return { day, hour };
  } catch {
    const now = new Date();
    return { day: now.getDay(), hour: now.getHours() };
  }
}

/**
 * Determines the most recent Friday's date in the given timezone.
 * If today is Friday and it's before 6pm, returns last Friday.
 * If today is Friday and it's 6pm or after, returns today.
 * If today is Saturday, returns yesterday (Friday).
 * If today is Sunday-Thursday, returns the previous Friday.
 */
function getReleaseDateForThisWeek(timezone: string): string {
  const { day, hour } = getDayAndHourInTimezone(timezone);

  if (day === 5) {
    // Friday
    if (hour >= 18) {
      return getDateInTimezone(timezone);
    }
    // Before 6pm — use last Friday
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }

  if (day === 6) {
    // Saturday — use yesterday
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  // Sunday-Thursday — find previous Friday
  const now = new Date();
  const daysSinceFriday = day === 0 ? 2 : day + 2; // Sun=0 -> 2, Mon=1 -> 3, etc.
  now.setDate(now.getDate() - daysSinceFriday);
  return now.toISOString().slice(0, 10);
}

/**
 * Checks if Saturday Ready is currently active for the user's timezone.
 * Active = Friday 6:00pm through Saturday 11:59pm.
 */
export function isSaturdayReadyActive(timezone: string): boolean {
  const { day, hour } = getDayAndHourInTimezone(timezone);

  if (day === 5) {
    // Friday
    return hour >= 18;
  }

  // Saturday — active all day
  return day === 6;
}

/**
 * Returns a human-readable countdown label or null if active.
 */
export function getCountdownLabel(timezone: string): string | null {
  if (isSaturdayReadyActive(timezone)) return null;

  const { day, hour } = getDayAndHourInTimezone(timezone);
  const hoursUntil6pm = 18 - hour;

  if (day === 5) {
    // It's Friday before 6pm
    if (hoursUntil6pm <= 1) {
      return 'Saturday Ready drops in less than an hour';
    }
    return `Saturday Ready drops at 6:00pm (in about ${hoursUntil6pm} hours)`;
  }

  // It's Sunday-Thursday
  const daysUntilFriday = day <= 5 ? 5 - day : 6; // days until Friday
  if (daysUntilFriday === 0) {
    return 'Saturday Ready drops today at 6:00pm';
  }
  if (daysUntilFriday === 1) {
    return 'Saturday Ready drops tomorrow at 6:00pm';
  }
  return `Saturday Ready drops in ${daysUntilFriday} days`;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchSaturdayReady(
  _releaseDate: string,
): Promise<SaturdayReadyRow | null> {
  // Primary: call the rotating-content RPC
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('get_current_saturday_ready')
    .maybeSingle();

  if (!rpcError && rpcResult) {
    return rpcResult as SaturdayReadyRow;
  }

  if (rpcError) {
    console.warn('[useSaturdayReady] RPC get_current_saturday_ready failed, falling back:', rpcError.message);
  }

  // Fallback: query the newest Saturday Ready entry
  const { data, error } = await supabase
    .from('saturday_ready')
    .select('*')
    .order('release_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function fetchSaturdayReadyResponse(
  userId: string,
  _saturdayReadyId: string,
): Promise<SaturdayReadyResponseRow | null> {
  // After migration 006, responses are keyed by (user_id, response_date).
  // Look up by today's date since at most one per calendar day.
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('saturday_ready_responses')
    .select('*')
    .eq('user_id', userId)
    .eq('response_date', today)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function upsertSaturdayReadyResponse(
  userId: string,
  saturdayReadyId: string,
  commitmentsSelected: string[],
  notes: string | null,
): Promise<SaturdayReadyResponseRow> {
  const today = new Date().toISOString().slice(0, 10);

  // After migration 006, responses are keyed by (user_id, response_date).
  const { data: existing } = await supabase
    .from('saturday_ready_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('response_date', today)
    .maybeSingle();

  const payload = {
    user_id: userId,
    saturday_ready_id: saturdayReadyId,
    response_date: today,
    commitments_selected: commitmentsSelected,
    notes,
    completed_at: new Date().toISOString(),
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('saturday_ready_responses')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return updated;
  }

  const { data: inserted, error } = await supabase
    .from('saturday_ready_responses')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return inserted;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSaturdayReady(): UseSaturdayReadyReturn {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? 'America/Chicago';

  const releaseDate = getReleaseDateForThisWeek(timezone);
  const active = isSaturdayReadyActive(timezone);
  const countdown = active ? null : getCountdownLabel(timezone);

  const {
    data: saturdayReady,
    isLoading: isSrLoading,
    isError: isSrError,
    error: srError,
  } = useQuery({
    queryKey: ['saturday-ready', releaseDate],
    queryFn: () => fetchSaturdayReady(releaseDate),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: response,
    isLoading: isRespLoading,
    isError: isRespError,
    error: respError,
  } = useQuery({
    queryKey: ['saturday-ready', 'response', saturdayReady?.id, user?.id],
    queryFn: () => fetchSaturdayReadyResponse(user!.id, saturdayReady!.id),
    enabled: !!user && !!saturdayReady,
    staleTime: 2 * 60 * 1000,
  });

  return {
    saturdayReady: saturdayReady ?? null,
    response: response ?? null,
    isLoading: isSrLoading || (!!saturdayReady && isRespLoading),
    isError: isSrError || isRespError,
    error: (srError as Error | null) ?? (respError as Error | null),
    isActive: active,
    countdownLabel: countdown,
  };
}

export function useSaturdayReadyResponse(): UseSaturdayReadyResponseReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: async ({
      saturdayReadyId,
      commitmentsSelected,
      notes,
    }: {
      saturdayReadyId: string;
      commitmentsSelected: string[];
      notes: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      return upsertSaturdayReadyResponse(
        user.id,
        saturdayReadyId,
        commitmentsSelected,
        notes,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['saturday-ready', 'response', variables.saturdayReadyId, user?.id],
      });
    },
  });

  const saveResponse = useCallback(
    async (data: { commitmentsSelected: string[]; notes: string | null }) => {
      // We need saturdayReadyId but it comes from the query;
      // this is called inline from the screen which has the SR id
      // We'll expose a more specific mutation in the calling context
      throw new Error(
        'Use saveResponse directly in the Saturday Ready screen with the SR id',
      );
    },
    [],
  );

  return {
    saveResponse,
    isSaving,
  };
}

/**
 * Direct mutation hook for Saturday Ready responses.
 * Use this when you have the saturdayReadyId in scope.
 */
export function useSaveSaturdayReadyResponse(saturdayReadyId: string): {
  save: (data: {
    commitmentsSelected: string[];
    notes: string | null;
  }) => Promise<void>;
  isSaving: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: async (data: {
      commitmentsSelected: string[];
      notes: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      return upsertSaturdayReadyResponse(
        user.id,
        saturdayReadyId,
        data.commitmentsSelected,
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['saturday-ready', 'response', saturdayReadyId, user?.id],
      });
    },
  });

  const save = useCallback(
    async (data: { commitmentsSelected: string[]; notes: string | null }) => {
      await mutateAsync(data);
    },
    [mutateAsync],
  );

  return { save, isSaving };
}
