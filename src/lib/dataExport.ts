import { supabase } from './supabase';
import type { Database } from '@/types/database';

interface ExportedUserData {
  exportedAt: string;
  profile: Record<string, unknown> | null;
  devotionalCompletions: Record<string, unknown>[];
  saturdayReadyResponses: Record<string, unknown>[];
  dealDebriefs: Record<string, unknown>[];
  confessionRepair: Record<string, unknown>[];
  situationSaves: Record<string, unknown>[];
  coachConversations: Record<string, unknown>[];
  coachMessages: Record<string, unknown>[];
  prayerGroupMemberships: Record<string, unknown>[];
  prayerRequests: Record<string, unknown>[];
  prayerInteractions: Record<string, unknown>[];
  discussionThreads: Record<string, unknown>[];
  discussionReplies: Record<string, unknown>[];
  readingPlanProgress: Record<string, unknown>[];
  memoryVerses: Record<string, unknown>[];
  serviceLog: Record<string, unknown>[];
}

export async function exportUserData(userId: string): Promise<string> {
  const [
    profileResult,
    completionsResult,
    saturdayReadyResult,
    debriefsResult,
    confessionResult,
    savesResult,
    conversationsResult,
    messagesResult,
    membershipsResult,
    prayerRequestsResult,
    prayerInteractionsResult,
    threadsResult,
    repliesResult,
    plansResult,
    versesResult,
    serviceResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('devotional_completions').select('*').eq('user_id', userId).order('completed_at', { ascending: true }),
    supabase.from('saturday_ready_responses').select('*').eq('user_id', userId),
    supabase.from('deal_debriefs').select('*').eq('user_id', userId).order('debrief_date', { ascending: true }),
    supabase.from('confession_repair').select('*').eq('user_id', userId).order('entry_date', { ascending: true }),
    supabase.from('situation_saves').select('*').eq('user_id', userId),
    supabase.from('coach_conversations').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('coach_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('prayer_group_members').select('*').eq('user_id', userId),
    supabase.from('prayer_requests').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('prayer_interactions').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('discussion_threads').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('discussion_replies').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('reading_plan_progress').select('*').eq('user_id', userId),
    supabase.from('memory_verses').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('service_log').select('*').eq('user_id', userId).order('logged_at', { ascending: true }),
  ]);

  const data: ExportedUserData = {
    exportedAt: new Date().toISOString(),
    profile: profileResult.data as Record<string, unknown> | null,
    devotionalCompletions: (completionsResult.data ?? []) as Record<string, unknown>[],
    saturdayReadyResponses: (saturdayReadyResult.data ?? []) as Record<string, unknown>[],
    dealDebriefs: (debriefsResult.data ?? []) as Record<string, unknown>[],
    confessionRepair: (confessionResult.data ?? []) as Record<string, unknown>[],
    situationSaves: (savesResult.data ?? []) as Record<string, unknown>[],
    coachConversations: (conversationsResult.data ?? []) as Record<string, unknown>[],
    coachMessages: (messagesResult.data ?? []) as Record<string, unknown>[],
    prayerGroupMemberships: (membershipsResult.data ?? []) as Record<string, unknown>[],
    prayerRequests: (prayerRequestsResult.data ?? []) as Record<string, unknown>[],
    prayerInteractions: (prayerInteractionsResult.data ?? []) as Record<string, unknown>[],
    discussionThreads: (threadsResult.data ?? []) as Record<string, unknown>[],
    discussionReplies: (repliesResult.data ?? []) as Record<string, unknown>[],
    readingPlanProgress: (plansResult.data ?? []) as Record<string, unknown>[],
    memoryVerses: (versesResult.data ?? []) as Record<string, unknown>[],
    serviceLog: (serviceResult.data ?? []) as Record<string, unknown>[],
  };

  return JSON.stringify(data, null, 2);
}
