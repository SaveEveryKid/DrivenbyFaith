import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  PrayerGroupRow,
  PrayerGroupMemberRow,
  PrayerRequestRow,
  PrayerInteractionRow,
} from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PrayerGroupWithMeta {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_by: string;
  is_private: boolean;
  created_at: string;
  member_count: number;
  user_role: 'member' | 'leader';
}

export interface PrayerGroupMember {
  user_id: string;
  display_name: string | null;
  role: 'member' | 'leader';
  joined_at: string;
}

export interface PrayerRequestSafe {
  id: string;
  group_id: string;
  user_id: string | null; // null when anonymous
  display_name: string | null;
  body: string;
  is_anonymous: boolean;
  is_praise: boolean;
  is_answered: boolean;
  answered_note: string | null;
  answered_at: string | null;
  created_at: string;
  prayer_count: number;
  has_prayed: boolean;
}

export interface CreateGroupInput {
  name: string;
  description?: string | null;
  is_private?: boolean;
}

export interface CreateRequestInput {
  group_id: string;
  body: string;
  is_anonymous?: boolean;
  is_praise?: boolean;
}

export interface MarkAnsweredInput {
  answered_note?: string;
}

export interface UsePrayerGroupsReturn {
  groups: PrayerGroupWithMeta[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface UsePrayerGroupReturn {
  group: PrayerGroupWithMeta | null;
  members: PrayerGroupMember[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface UsePrayerRequestsReturn {
  requests: PrayerRequestSafe[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps supabase.rpc to work around the Database type's empty Functions record.
 * The RPC functions are defined in migrations but not reflected in the generated types.
 */
function callRpc<T>(
  fn: string,
  params?: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.rpc as any)(fn, params ?? {});
}

/**
 * Generates a unique 6-character join code by calling the DB function.
 * Retries up to 3 times if the code collides.
 */
async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await callRpc<string>('generate_join_code');
    if (error) throw error;

    const code = data as string;

    // Check uniqueness
    const { data: existing } = await supabase
      .from('prayer_groups')
      .select('id')
      .eq('join_code', code)
      .maybeSingle();

    if (!existing) return code;
  }
  throw new Error('Could not generate unique join code. Please try again.');
}

/**
 * Fetches prayer groups for the current user with member counts and roles.
 */
async function fetchUserPrayerGroups(userId: string): Promise<PrayerGroupWithMeta[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('prayer_group_members')
    .select('group_id, role')
    .eq('user_id', userId);

  if (memberError) throw memberError;
  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups, error: groupError } = await supabase
    .from('prayer_groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (groupError) throw groupError;
  if (!groups) return [];

  // Get member counts via RPC
  const results: PrayerGroupWithMeta[] = await Promise.all(
    groups.map(async (g) => {
      const { data: count } = await callRpc<number>('get_group_member_count', {
        gid: g.id,
      });
      const membership = memberships.find((m) => m.group_id === g.id);
      return {
        ...g,
        member_count: (count as number) ?? 0,
        user_role: membership?.role ?? 'member',
      };
    }),
  );

  return results;
}

/**
 * Fetches members of a prayer group with display names.
 */
async function fetchGroupMembers(groupId: string): Promise<PrayerGroupMember[]> {
  const { data: members, error } = await supabase
    .from('prayer_group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  if (!members) return [];

  const results: PrayerGroupMember[] = await Promise.all(
    members.map(async (m) => {
      const { data: displayName } = await callRpc<string>('get_display_name', {
        uid: m.user_id,
      });
      return {
        user_id: m.user_id,
        display_name: (displayName as string) ?? null,
        role: m.role,
        joined_at: m.joined_at,
      };
    }),
  );

  return results;
}

/**
 * Fetches prayer requests for a group using the safe view.
 * Also fetches prayer counts and whether current user has prayed.
 */
async function fetchPrayerRequests(
  groupId: string,
  currentUserId: string,
): Promise<PrayerRequestSafe[]> {
  const { data: requests, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .eq('group_id', groupId)
    .is('removed_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!requests || requests.length === 0) return [];

  const requestIds = requests.map((r) => r.id);

  // Get all interactions for these requests
  const { data: interactions } = await supabase
    .from('prayer_interactions')
    .select('request_id, user_id')
    .in('request_id', requestIds);

  const interactionMap = new Map<string, { count: number; hasPrayed: boolean }>();
  if (interactions) {
    for (const inter of interactions) {
      const entry = interactionMap.get(inter.request_id) ?? { count: 0, hasPrayed: false };
      entry.count++;
      if (inter.user_id === currentUserId) {
        entry.hasPrayed = true;
      }
      interactionMap.set(inter.request_id, entry);
    }
  }

  // Fetch display names for non-anonymous requests
  const results: PrayerRequestSafe[] = await Promise.all(
    requests.map(async (r) => {
      const interEntry = interactionMap.get(r.id) ?? { count: 0, hasPrayed: false };
      let displayName: string | null = null;
      if (!r.is_anonymous && r.user_id) {
        const { data: name } = await callRpc<string>('get_display_name', {
          uid: r.user_id,
        });
        displayName = (name as string) ?? null;
      }
      return {
        id: r.id,
        group_id: r.group_id,
        user_id: r.is_anonymous ? null : r.user_id,
        display_name: displayName,
        body: r.body,
        is_anonymous: r.is_anonymous,
        is_praise: r.is_praise,
        is_answered: r.is_answered,
        answered_note: r.answered_note,
        answered_at: r.answered_at,
        created_at: r.created_at,
        prayer_count: interEntry.count,
        has_prayed: interEntry.hasPrayed,
      };
    }),
  );

  return results;
}

/**
 * Fetches answered prayer requests for a group.
 */
async function fetchAnsweredRequests(
  groupId: string,
  currentUserId: string,
): Promise<PrayerRequestSafe[]> {
  const { data: requests, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_answered', true)
    .is('removed_at', null)
    .order('answered_at', { ascending: false });

  if (error) throw error;
  if (!requests || requests.length === 0) return [];

  const requestIds = requests.map((r) => r.id);

  const { data: interactions } = await supabase
    .from('prayer_interactions')
    .select('request_id, user_id')
    .in('request_id', requestIds);

  const interactionMap = new Map<string, { count: number; hasPrayed: boolean }>();
  if (interactions) {
    for (const inter of interactions) {
      const entry = interactionMap.get(inter.request_id) ?? { count: 0, hasPrayed: false };
      entry.count++;
      if (inter.user_id === currentUserId) {
        entry.hasPrayed = true;
      }
      interactionMap.set(inter.request_id, entry);
    }
  }

  const results: PrayerRequestSafe[] = await Promise.all(
    requests.map(async (r) => {
      const interEntry = interactionMap.get(r.id) ?? { count: 0, hasPrayed: false };
      let displayName: string | null = null;
      if (!r.is_anonymous && r.user_id) {
        const { data: name } = await callRpc<string>('get_display_name', {
          uid: r.user_id,
        });
        displayName = (name as string) ?? null;
      }
      return {
        id: r.id,
        group_id: r.group_id,
        user_id: r.is_anonymous ? null : r.user_id,
        display_name: displayName,
        body: r.body,
        is_anonymous: r.is_anonymous,
        is_praise: r.is_praise,
        is_answered: r.is_answered,
        answered_note: r.answered_note,
        answered_at: r.answered_at,
        created_at: r.created_at,
        prayer_count: interEntry.count,
        has_prayed: interEntry.hasPrayed,
      };
    }),
  );

  return results;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePrayerGroups(): UsePrayerGroupsReturn {
  const { user } = useAuth();

  const {
    data: groups,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['prayer', 'groups', user?.id],
    queryFn: () => fetchUserPrayerGroups(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  return {
    groups: groups ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function usePrayerGroup(groupId: string): UsePrayerGroupReturn {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['prayer', 'group', groupId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: groupData, error: groupError } = await supabase
        .from('prayer_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      if (!groupData) return null;

      const { data: count } = await callRpc<number>('get_group_member_count', {
        gid: groupId,
      });

      const { data: membership } = await supabase
        .from('prayer_group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      const [members] = await Promise.all([
        fetchGroupMembers(groupId),
      ]);

      return {
        group: {
          ...groupData,
          member_count: (count as number) ?? 0,
          user_role: (membership?.role as 'member' | 'leader') ?? 'member',
        } as PrayerGroupWithMeta,
        members,
      };
    },
    enabled: !!user && !!groupId,
    staleTime: 30 * 1000,
  });

  return {
    group: data?.group ?? null,
    members: data?.members ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function usePrayerRequests(groupId: string): UsePrayerRequestsReturn {
  const { user } = useAuth();

  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prayer', 'requests', groupId, user?.id],
    queryFn: () => fetchPrayerRequests(groupId, user!.id),
    enabled: !!user && !!groupId,
    staleTime: 30 * 1000,
  });

  return {
    requests: requests ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refresh: refetch,
  };
}

export function useAnsweredRequests(groupId: string): UsePrayerRequestsReturn {
  const { user } = useAuth();

  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prayer', 'answered', groupId, user?.id],
    queryFn: () => fetchAnsweredRequests(groupId, user!.id),
    enabled: !!user && !!groupId,
    staleTime: 30 * 1000,
  });

  return {
    requests: requests ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refresh: refetch,
  };
}

export function useCreateGroup(): {
  createGroup: (input: CreateGroupInput) => Promise<PrayerGroupRow>;
  isCreating: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<PrayerGroupRow> => {
      if (!user) throw new Error('Must be authenticated');

      const joinCode = await generateUniqueJoinCode();

      const { data: group, error: groupError } = await supabase
        .from('prayer_groups')
        .insert({
          name: input.name,
          description: input.description ?? null,
          join_code: joinCode,
          created_by: user.id,
          is_private: input.is_private ?? false,
        })
        .select('*')
        .single();

      if (groupError) throw groupError;

      // Add creator as leader
      const { error: memberError } = await supabase
        .from('prayer_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'leader',
        });

      if (memberError) throw memberError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer', 'groups'] });
    },
  });

  const createGroup = useCallback(
    async (input: CreateGroupInput) => mutateAsync(input),
    [mutateAsync],
  );

  return { createGroup, isCreating: isPending };
}

export function useJoinGroup(): {
  joinGroup: (code: string) => Promise<void>;
  isJoining: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (code: string): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const normalizedCode = code.trim().toUpperCase();

      // Look up group by join code
      const { data: group, error: lookupError } = await supabase
        .from('prayer_groups')
        .select('id')
        .eq('join_code', normalizedCode)
        .single();

      if (lookupError || !group) {
        throw new Error('No group found with that code. Check the code and try again.');
      }

      // Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('prayer_group_members')
        .select('group_id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        throw new Error('You are already a member of this group.');
      }

      const { error: joinError } = await supabase
        .from('prayer_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer', 'groups'] });
    },
  });

  const joinGroup = useCallback(
    async (code: string) => mutateAsync(code),
    [mutateAsync],
  );

  return { joinGroup, isJoining: isPending };
}

export function useLeaveGroup(): {
  leaveGroup: (groupId: string) => Promise<void>;
  isLeaving: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (groupId: string): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase
        .from('prayer_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer', 'groups'] });
    },
  });

  const leaveGroup = useCallback(
    async (groupId: string) => mutateAsync(groupId),
    [mutateAsync],
  );

  return { leaveGroup, isLeaving: isPending };
}

export function useCreatePrayerRequest(): {
  createRequest: (input: CreateRequestInput) => Promise<void>;
  isCreating: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (input: CreateRequestInput): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase.from('prayer_requests').insert({
        group_id: input.group_id,
        user_id: user.id,
        body: input.body,
        is_anonymous: input.is_anonymous ?? false,
        is_praise: input.is_praise ?? false,
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'requests', variables.group_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'answered', variables.group_id],
      });
    },
  });

  const createRequest = useCallback(
    async (input: CreateRequestInput) => mutateAsync(input),
    [mutateAsync],
  );

  return { createRequest, isCreating: isPending };
}

export function useInteractPrayer(): {
  interact: (requestId: string, groupId: string) => Promise<void>;
  isInteracting: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      requestId,
      groupId,
    }: {
      requestId: string;
      groupId: string;
    }): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase.from('prayer_interactions').insert({
        request_id: requestId,
        user_id: user.id,
      });

      if (error) {
        // UNIQUE constraint violation — already prayed; this is fine
        if (error.code === '23505') return;
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'requests', variables.groupId],
      });
    },
  });

  const interact = useCallback(
    async (requestId: string, groupId: string) =>
      mutateAsync({ requestId, groupId }),
    [mutateAsync],
  );

  return { interact, isInteracting: isPending };
}

export function useMarkAnswered(): {
  markAnswered: (
    requestId: string,
    groupId: string,
    input: MarkAnsweredInput,
  ) => Promise<void>;
  isMarking: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      requestId,
      groupId,
      input,
    }: {
      requestId: string;
      groupId: string;
      input: MarkAnsweredInput;
    }): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase
        .from('prayer_requests')
        .update({
          is_answered: true,
          answered_note: input.answered_note ?? null,
          answered_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'requests', variables.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'answered', variables.groupId],
      });
    },
  });

  const markAnswered = useCallback(
    async (requestId: string, groupId: string, input: MarkAnsweredInput) =>
      mutateAsync({ requestId, groupId, input }),
    [mutateAsync],
  );

  return { markAnswered, isMarking: isPending };
}

export function useReportContent(): {
  report: (
    contentType: 'prayer_request' | 'discussion_thread' | 'discussion_reply',
    contentId: string,
    reason: string,
  ) => Promise<void>;
  isReporting: boolean;
} {
  const { user } = useAuth();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      reason,
    }: {
      contentType: 'prayer_request' | 'discussion_thread' | 'discussion_reply';
      contentId: string;
      reason: string;
    }): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
      });

      if (error) throw error;
    },
  });

  const report = useCallback(
    async (
      contentType: 'prayer_request' | 'discussion_thread' | 'discussion_reply',
      contentId: string,
      reason: string,
    ) => mutateAsync({ contentType, contentId, reason }),
    [mutateAsync],
  );

  return { report, isReporting: isPending };
}

export function useRemoveMember(): {
  removeMember: (groupId: string, memberUserId: string) => Promise<void>;
  isRemoving: boolean;
} {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      groupId,
      memberUserId,
    }: {
      groupId: string;
      memberUserId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('prayer_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberUserId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'group', variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ['prayer', 'groups'] });
    },
  });

  const removeMember = useCallback(
    async (groupId: string, memberUserId: string) =>
      mutateAsync({ groupId, memberUserId }),
    [mutateAsync],
  );

  return { removeMember, isRemoving: isPending };
}

export function useRemovePrayerRequest(): {
  removeRequest: (requestId: string, groupId: string) => Promise<void>;
  isRemoving: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      requestId,
      groupId,
    }: {
      requestId: string;
      groupId: string;
    }): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase
        .from('prayer_requests')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['prayer', 'requests', variables.groupId],
      });
    },
  });

  const removeRequest = useCallback(
    async (requestId: string, groupId: string) =>
      mutateAsync({ requestId, groupId }),
    [mutateAsync],
  );

  return { removeRequest, isRemoving: isPending };
}
