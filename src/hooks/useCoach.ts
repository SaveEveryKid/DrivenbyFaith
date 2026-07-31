import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type {
  CoachConversationRow,
  CoachMessageRow,
} from '@/types/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoachUsageState {
  messagesUsedThisMonth: number;
  limit: number;
  isPremium: boolean;
}

export interface CoachMessagePayload {
  role: 'assistant';
  content: string;
  scripture_refs: string[] | null;
}

export interface CoachUsagePayload {
  current: number;
  limit: number;
  is_premium: boolean;
}

export interface CoachResponse {
  message: CoachMessagePayload;
  usage: CoachUsagePayload;
}

export interface ConversationListItem {
  id: string;
  title: string | null;
  created_at: string;
  last_message_at: string | null;
  message_count: number;
}

export interface UseCoachConversationsReturn {
  conversations: ConversationListItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => void;
}

export interface UseCoachMessagesReturn {
  messages: CoachMessageRow[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface UseCreateConversationReturn {
  createConversation: (context?: string) => Promise<CoachConversationRow>;
  isCreating: boolean;
}

export interface UseCoachUsageReturn {
  usage: CoachUsageState;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export class RateLimitError extends Error {
  limit: number;
  current: number;
  isPremium: boolean;

  constructor(data: { limit: number; current: number; is_premium: boolean }) {
    super('Daily message limit reached');
    this.name = 'RateLimitError';
    this.limit = data.limit;
    this.current = data.current;
    this.isPremium = data.is_premium;
  }
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchConversations(userId: string): Promise<ConversationListItem[]> {
  const { data: conversations, error } = await supabase
    .from('coach_conversations')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!conversations || conversations.length === 0) return [];

  // Fetch last message for each conversation
  const conversationIds = conversations.map((c) => c.id);
  const { data: lastMessages, error: msgError } = await supabase
    .from('coach_messages')
    .select('conversation_id, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });

  if (msgError) throw msgError;

  // Build a map of conversation_id → last message timestamp
  const lastMsgMap = new Map<string, string>();
  const countMap = new Map<string, number>();
  if (lastMessages) {
    for (const msg of lastMessages) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg.created_at);
      }
      countMap.set(msg.conversation_id, (countMap.get(msg.conversation_id) ?? 0) + 1);
    }
  }

  return conversations.map((c) => ({
    id: c.id,
    title: c.title,
    created_at: c.created_at,
    last_message_at: lastMsgMap.get(c.id) ?? null,
    message_count: countMap.get(c.id) ?? 0,
  }));
}

async function fetchMessages(conversationId: string): Promise<CoachMessageRow[]> {
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchUsage(userId: string): Promise<CoachUsageState> {
  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const isPremium = profile?.subscription_tier === 'premium';
  const limit = isPremium ? 100 : 5;

  const { data: usageRow } = await supabase
    .from('coach_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  return {
    messagesUsedThisMonth: usageRow?.message_count ?? 0,
    limit,
    isPremium,
  };
}

// ─── Stream reader helper ────────────────────────────────────────────────────

interface NativeReadableStreamDefaultReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
  cancel(): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class NativeTextDecoder {
  constructor(_encoding?: string);
  decode(_buffer?: ArrayBuffer | SharedArrayBuffer, _options?: { stream?: boolean }): string;
}

/**
 * Reads a streaming response body line-by-line. Handles both SSE
 * (text/event-stream) and NDJSON (application/x-ndjson) formats.
 * Calls `onToken` with each content token and `onComplete` with the
 * full assembled response when the stream ends.
 */
async function readStreamResponse(
  response: Response,
  onToken: (token: string) => void,
): Promise<CoachResponse> {
  // Access body reader via type assertion (available in React Native / Hermes)
  const body = response as Response & { body: { getReader(): NativeReadableStreamDefaultReader } | null };
  const reader = body.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const TextDecoderCtor = (globalThis as Record<string, unknown>)['TextDecoder'] as typeof NativeTextDecoder | undefined;
  const decoder = TextDecoderCtor ? new TextDecoderCtor() : null;

  let fullContent = '';
  let scriptureRefs: string[] | null = null;
  let usage: CoachUsagePayload | null = null;

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode bytes to string
    const chunk = decoder
      ? decoder.decode(value?.buffer, { stream: true })
      : uint8ArrayToString(value ?? new Uint8Array());

    buffer += chunk;

    // Process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // SSE format: "data: {...}"
      let jsonStr = trimmed;
      if (trimmed.startsWith('data: ')) {
        jsonStr = trimmed.slice(6);
      }

      if (jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);

        if (parsed.type === 'token' && typeof parsed.content === 'string') {
          fullContent += parsed.content;
          onToken(parsed.content);
        } else if (parsed.type === 'complete') {
          fullContent = parsed.content ?? fullContent;
          scriptureRefs = parsed.scripture_refs ?? null;
          usage = parsed.usage ?? null;
        } else if (parsed.role === 'assistant' && parsed.content) {
          // Handle a full message chunk
          fullContent = parsed.content;
          scriptureRefs = parsed.scripture_refs ?? null;
          usage = parsed.usage ?? null;
        }
      } catch {
        // Non-JSON line, skip (e.g., SSE comment)
      }
    }
  }

  if (!usage) {
    throw new Error('Stream ended without usage data');
  }

  return {
    message: {
      role: 'assistant',
      content: fullContent || 'I apologize, but I was unable to generate a response. Please try again.',
      scripture_refs: scriptureRefs,
    },
    usage: {
      current: usage.current,
      limit: usage.limit,
      is_premium: usage.is_premium,
    },
  };
}

/** Fallback UTF-8 decoder when TextDecoder is unavailable */
function uint8ArrayToString(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

// ─── Core send function ──────────────────────────────────────────────────────

async function postToCoach(
  conversationId: string,
  message: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<Response> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

  const response = await fetch(`${supabaseUrl}/functions/v1/coach`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
    signal,
  });

  return response;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCoachConversations(): UseCoachConversationsReturn {
  const { user } = useAuth();

  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['coach', 'conversations', user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  return {
    conversations,
    isLoading,
    isError,
    error: error as Error | null,
    refresh: refetch,
  };
}

export function useCoachMessages(conversationId: string | null): UseCoachMessagesReturn {
  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['coach', 'messages', conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 10 * 1000,
  });

  return {
    messages,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useCreateConversation(): UseCreateConversationReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isCreating } = useMutation({
    mutationFn: async (context?: string): Promise<CoachConversationRow> => {
      if (!user) throw new Error('Not authenticated');

      const title = context
        ? context.length > 60
          ? context.slice(0, 60) + '...'
          : context
        : null;

      const { data, error } = await supabase
        .from('coach_conversations')
        .insert({
          user_id: user.id,
          title,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations', user?.id] });
    },
  });

  return {
    createConversation: mutateAsync,
    isCreating,
  };
}

export function useSendMessage() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (convId: string, message: string): Promise<CoachResponse> => {
      if (!user || !session) {
        throw new Error('Not authenticated');
      }

      // Reset streaming state
      setIsStreaming(true);
      setStreamingContent('');

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        // Optimistically add the user message to cache
        const optimisticUserMsg: CoachMessageRow = {
          id: `temp-${Date.now()}`,
          conversation_id: convId,
          role: 'user',
          content: message.trim(),
          scripture_refs: null,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<CoachMessageRow[]>(
          ['coach', 'messages', convId],
          (old = []) => [...old, optimisticUserMsg],
        );

        const response = await postToCoach(
          convId,
          message.trim(),
          session.access_token,
          abortController.signal,
        );

        if (response.status === 429) {
          const errorData = await response.json();
          throw new RateLimitError({
            limit: errorData.limit,
            current: errorData.current,
            is_premium: errorData.is_premium,
          });
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ?? 'Could not reach the Coach. Try again.',
          );
        }

        const contentType = response.headers.get('Content-Type') ?? '';

        let result: CoachResponse;

        if (
          contentType.includes('text/event-stream') ||
          contentType.includes('application/x-ndjson')
        ) {
          // Streaming path
          result = await readStreamResponse(response, (token) => {
            setStreamingContent((prev) => prev + token);
          });
        } else {
          // JSON path (current implementation)
          const data = await response.json();
          result = {
            message: data.message,
            usage: data.usage,
          };
          // Simulate streaming for smooth UX
          setStreamingContent(data.message.content);
        }

        // Add assistant message to cache (optimistic)
        const assistantMsg: CoachMessageRow = {
          id: `temp-assistant-${Date.now()}`,
          conversation_id: convId,
          role: 'assistant',
          content: result.message.content,
          scripture_refs: result.message.scripture_refs,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<CoachMessageRow[]>(
          ['coach', 'messages', convId],
          (old = []) => [...old, assistantMsg],
        );

        // Invalidate queries for fresh data
        queryClient.invalidateQueries({
          queryKey: ['coach', 'messages', convId],
        });
        queryClient.invalidateQueries({
          queryKey: ['coach', 'conversations', user.id],
        });
        queryClient.invalidateQueries({
          queryKey: ['coach', 'usage', user.id],
        });

        return result;
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        abortRef.current = null;
      }
    },
    [user, session, queryClient],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    cancelStream,
  };
}

export function useCoachUsage(): UseCoachUsageReturn {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const {
    data: usage,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['coach', 'usage', user?.id],
    queryFn: () => fetchUsage(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
    // Refetch on date change by including date in query key
    ...({} as Record<string, unknown>),
  });

  // Force a refetch when the date changes
  const queryKeyDate = today;

  return {
    usage: usage ?? { messagesUsedThisMonth: 0, limit: 5, isPremium: false },
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export function useDeleteConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isDeleting } = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Delete messages first (RLS handles ownership)
      const { error: msgError } = await supabase
        .from('coach_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (msgError) throw msgError;

      // Delete conversation
      const { error: convError } = await supabase
        .from('coach_conversations')
        .delete()
        .eq('id', conversationId);

      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations', user?.id] });
    },
  });

  return {
    deleteConversation: mutateAsync,
    isDeleting,
  };
}
