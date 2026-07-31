import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  DiscussionThreadRow,
  DiscussionReplyRow,
} from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DiscussionCategory =
  | 'floor_life'
  | 'integrity_questions'
  | 'family_schedule'
  | 'leading_others'
  | 'testimonies'
  | 'prayer_for_industry';

export interface DiscussionThreadWithMeta {
  id: string;
  category: DiscussionCategory;
  title: string;
  body: string;
  user_id: string | null;
  display_name: string | null;
  is_anonymous: boolean;
  reply_count: number;
  created_at: string;
}

export interface DiscussionReplyWithMeta {
  id: string;
  thread_id: string;
  user_id: string | null;
  display_name: string | null;
  body: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface CategoryInfo {
  category: DiscussionCategory;
  label: string;
  description: string;
  thread_count: number;
}

export interface CreateThreadInput {
  category: DiscussionCategory;
  title: string;
  body: string;
  is_anonymous?: boolean;
}

export interface CreateReplyInput {
  thread_id: string;
  body: string;
  is_anonymous?: boolean;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    category: 'floor_life',
    label: 'Floor Life',
    description: 'The day-to-day realities of the dealership.',
    thread_count: 0,
  },
  {
    category: 'integrity_questions',
    label: 'Integrity Questions',
    description: 'Wrestling with what is right when the deal is on the line.',
    thread_count: 0,
  },
  {
    category: 'family_schedule',
    label: 'Family & Schedule',
    description: 'Marriage, kids, and the hours this job demands.',
    thread_count: 0,
  },
  {
    category: 'leading_others',
    label: 'Leading Others',
    description: 'Being a light on the floor, not just in the pew.',
    thread_count: 0,
  },
  {
    category: 'testimonies',
    label: 'Testimonies',
    description: 'What God is doing in your work.',
    thread_count: 0,
  },
  {
    category: 'prayer_for_industry',
    label: 'Prayer for the Industry',
    description: 'Lifting up our customers, managers, and competitors.',
    thread_count: 0,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps supabase.rpc to work around the Database type's empty Functions record.
 */
function callRpc<T>(
  fn: string,
  params?: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.rpc as any)(fn, params ?? {});
}

async function fetchDisplayName(userId: string): Promise<string | null> {
  const { data } = await callRpc<string>('get_display_name', { uid: userId });
  return (data as string) ?? null;
}

async function getCategoryThreadCount(
  category: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('discussion_threads')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .is('removed_at', null);

  if (error) throw error;
  return count ?? 0;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useDiscussionCategories(): {
  categories: CategoryInfo[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['discussions', 'categories'],
    queryFn: async (): Promise<CategoryInfo[]> => {
      const results = await Promise.all(
        CATEGORIES.map(async (cat) => {
          const count = await getCategoryThreadCount(cat.category);
          return { ...cat, thread_count: count };
        }),
      );
      return results;
    },
    staleTime: 60 * 1000,
  });

  return {
    categories: categories ?? CATEGORIES,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useDiscussionThreads(
  category: string,
): {
  threads: DiscussionThreadWithMeta[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const {
    data: threads,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['discussions', 'threads', category],
    queryFn: async (): Promise<DiscussionThreadWithMeta[]> => {
      const { data, error: queryError } = await supabase
        .from('discussion_threads')
        .select('*')
        .eq('category', category)
        .is('removed_at', null)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      if (!data) return [];

      const results: DiscussionThreadWithMeta[] = await Promise.all(
        data.map(async (t) => {
          let displayName: string | null = null;
          if (!t.is_anonymous && t.user_id) {
            displayName = await fetchDisplayName(t.user_id);
          }
          return {
            id: t.id,
            category: t.category as DiscussionCategory,
            title: t.title,
            body: t.body,
            user_id: t.is_anonymous ? null : t.user_id,
            display_name: displayName,
            is_anonymous: t.is_anonymous,
            reply_count: t.reply_count,
            created_at: t.created_at,
          };
        }),
      );

      return results;
    },
    enabled: !!category,
    staleTime: 30 * 1000,
  });

  return {
    threads: threads ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refresh: refetch,
  };
}

export function useDiscussionThread(
  threadId: string,
): {
  thread: DiscussionThreadWithMeta | null;
  replies: DiscussionReplyWithMeta[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['discussions', 'thread', threadId],
    queryFn: async () => {
      const { data: threadData, error: threadError } = await supabase
        .from('discussion_threads')
        .select('*')
        .eq('id', threadId)
        .is('removed_at', null)
        .single();

      if (threadError) throw threadError;
      if (!threadData) return null;

      let threadDisplayName: string | null = null;
      if (!threadData.is_anonymous && threadData.user_id) {
        threadDisplayName = await fetchDisplayName(threadData.user_id);
      }

      const thread: DiscussionThreadWithMeta = {
        id: threadData.id,
        category: threadData.category as DiscussionCategory,
        title: threadData.title,
        body: threadData.body,
        user_id: threadData.is_anonymous ? null : threadData.user_id,
        display_name: threadDisplayName,
        is_anonymous: threadData.is_anonymous,
        reply_count: threadData.reply_count,
        created_at: threadData.created_at,
      };

      // Fetch replies
      const { data: replyData, error: replyError } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('thread_id', threadId)
        .is('removed_at', null)
        .order('created_at', { ascending: true });

      if (replyError) throw replyError;

      const replies: DiscussionReplyWithMeta[] = replyData
        ? await Promise.all(
            replyData.map(async (r) => {
              let replyDisplayName: string | null = null;
              if (!r.is_anonymous && r.user_id) {
                replyDisplayName = await fetchDisplayName(r.user_id);
              }
              return {
                id: r.id,
                thread_id: r.thread_id,
                user_id: r.is_anonymous ? null : r.user_id,
                display_name: replyDisplayName,
                body: r.body,
                is_anonymous: r.is_anonymous,
                created_at: r.created_at,
              };
            }),
          )
        : [];

      return { thread, replies };
    },
    enabled: !!threadId,
    staleTime: 15 * 1000,
  });

  return {
    thread: data?.thread ?? null,
    replies: data?.replies ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refresh: refetch,
  };
}

export function useCreateThread(): {
  createThread: (input: CreateThreadInput) => Promise<DiscussionThreadRow>;
  isCreating: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (input: CreateThreadInput): Promise<DiscussionThreadRow> => {
      if (!user) throw new Error('Must be authenticated');

      const { data, error } = await supabase
        .from('discussion_threads')
        .insert({
          category: input.category,
          title: input.title,
          body: input.body,
          user_id: user.id,
          is_anonymous: input.is_anonymous ?? false,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['discussions', 'threads', variables.category],
      });
      queryClient.invalidateQueries({
        queryKey: ['discussions', 'categories'],
      });
    },
  });

  const createThread = useCallback(
    async (input: CreateThreadInput) => mutateAsync(input),
    [mutateAsync],
  );

  return { createThread, isCreating: isPending };
}

export function useCreateReply(): {
  createReply: (input: CreateReplyInput) => Promise<void>;
  isCreating: boolean;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (input: CreateReplyInput): Promise<void> => {
      if (!user) throw new Error('Must be authenticated');

      const { error } = await supabase.from('discussion_replies').insert({
        thread_id: input.thread_id,
        user_id: user.id,
        body: input.body,
        is_anonymous: input.is_anonymous ?? false,
      });

      if (error) throw error;

      // Increment reply count
      await callRpc<void>('increment_thread_reply_count', {
        tid: input.thread_id,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['discussions', 'thread', variables.thread_id],
      });
    },
  });

  const createReply = useCallback(
    async (input: CreateReplyInput) => mutateAsync(input),
    [mutateAsync],
  );

  return { createReply, isCreating: isPending };
}

export function useEditThread(): {
  editThread: (id: string, title: string, body: string) => Promise<void>;
  isEditing: boolean;
} {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      id,
      title,
      body,
    }: {
      id: string;
      title: string;
      body: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('discussion_threads')
        .update({ title, body })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', 'thread'] });
      queryClient.invalidateQueries({ queryKey: ['discussions', 'threads'] });
    },
  });

  const editThread = useCallback(
    async (id: string, title: string, body: string) =>
      mutateAsync({ id, title, body }),
    [mutateAsync],
  );

  return { editThread, isEditing: isPending };
}

export function useEditReply(): {
  editReply: (id: string, body: string) => Promise<void>;
  isEditing: boolean;
} {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('discussion_replies')
        .update({ body })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', 'thread'] });
    },
  });

  const editReply = useCallback(
    async (id: string, body: string) => mutateAsync({ id, body }),
    [mutateAsync],
  );

  return { editReply, isEditing: isPending };
}

export function useDeleteThread(): {
  deleteThread: (id: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('discussion_threads')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['discussions', 'categories'] });
    },
  });

  const deleteThread = useCallback(
    async (id: string) => mutateAsync(id),
    [mutateAsync],
  );

  return { deleteThread, isDeleting: isPending };
}

export function useDeleteReply(): {
  deleteReply: (id: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('discussion_replies')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', 'thread'] });
    },
  });

  const deleteReply = useCallback(
    async (id: string) => mutateAsync(id),
    [mutateAsync],
  );

  return { deleteReply, isDeleting: isPending };
}
