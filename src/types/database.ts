// =============================================================================
// Database types — Supabase-compatible schema definition
// =============================================================================

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  display_name: string | null;
  dealership: string | null;
  brand: string | null;
  role: string | null;
  years_in_business: number | null;
  faith_context: 'new_to_faith' | 'coming_back' | 'walking_steady' | 'leading_others' | null;
  burdens: string[] | null;
  timezone: string;
  onboarding_complete: boolean;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at: string | null;
  notification_preferences: Record<string, unknown> | null;
  translation: string;
  line_wont_cross: string | null;
  line_wont_cross_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  display_name?: string | null;
  dealership?: string | null;
  brand?: string | null;
  role?: string | null;
  years_in_business?: number | null;
  faith_context?: 'new_to_faith' | 'coming_back' | 'walking_steady' | 'leading_others' | null;
  burdens?: string[] | null;
  timezone?: string;
  onboarding_complete?: boolean;
  subscription_tier?: 'free' | 'premium';
  subscription_expires_at?: string | null;
  notification_preferences?: Record<string, unknown> | null;
  translation?: string;
  line_wont_cross?: string | null;
}

export interface ProfileUpdate {
  display_name?: string | null;
  dealership?: string | null;
  brand?: string | null;
  role?: string | null;
  years_in_business?: number | null;
  faith_context?: 'new_to_faith' | 'coming_back' | 'walking_steady' | 'leading_others' | null;
  burdens?: string[] | null;
  timezone?: string;
  onboarding_complete?: boolean;
  subscription_tier?: 'free' | 'premium';
  subscription_expires_at?: string | null;
  notification_preferences?: Record<string, unknown> | null;
  translation?: string;
  line_wont_cross?: string | null;
  line_wont_cross_updated_at?: string | null;
}

// ─── Devotional ──────────────────────────────────────────────────────────────

export interface DevotionalRow {
  id: string;
  publish_date: string;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  translation: string;
  workplace_application: string;
  reflection_prompt: string;
  prayer: string;
  challenge: string;
  audio_url: string | null;
  is_premium: boolean;
  created_at: string;
}

// ─── Devotional Completion ───────────────────────────────────────────────────

export interface DevotionalCompletionRow {
  id: string;
  user_id: string;
  devotional_id: string;
  completed_at: string;
  reflection_response: string | null;
  challenge_accepted: boolean;
  challenge_completed: boolean;
  prayer_duration_seconds: number | null;
  client_updated_at: string | null;
}

// ─── Saturday Ready ──────────────────────────────────────────────────────────

export interface SaturdayReadyRow {
  id: string;
  release_date: string;
  theme: string;
  scripture_reference: string;
  scripture_text: string;
  preparation_body: string;
  three_commitments: string[];
  prayer: string;
  audio_url: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface SaturdayReadyResponseRow {
  id: string;
  user_id: string;
  saturday_ready_id: string;
  commitments_selected: string[] | null;
  notes: string | null;
  completed_at: string;
}

// ─── Deal Debrief ────────────────────────────────────────────────────────────

export interface DealDebriefRow {
  id: string;
  user_id: string;
  debrief_date: string;
  units_sold: number | null;
  ups_taken: number | null;
  went_well: string | null;
  went_wrong: string | null;
  where_i_saw_god: string | null;
  where_i_fell_short: string | null;
  who_i_served: string | null;
  tomorrow_intention: string | null;
  gratitude: string | null;
  mood: number | null;
  client_updated_at: string | null;
}

// ─── Confession & Repair ──────────────────────────────────────────────────────

export interface ConfessionRepairRow {
  id: string;
  user_id: string;
  entry_date: string;
  confession: string;
  repair_step: string;
  created_at: string;
}

// ─── Situation ───────────────────────────────────────────────────────────────

export interface SituationRow {
  id: string;
  slug: string;
  category: 'customer' | 'management' | 'coworker' | 'self' | 'family' | 'money' | 'ethics';
  title: string;
  situation_body: string;
  biblical_principle: string;
  scripture_refs: ScriptureRef[];
  practical_response: string;
  prayer: string;
  reflection_question: string;
  is_premium: boolean;
  search_vector: unknown;
  created_at: string;
}

// ─── Scripture reference helper type ─────────────────────────────────────────

export interface ScriptureRef {
  reference: string;
  text: string;
}

export interface SituationSaveRow {
  id: string;
  user_id: string;
  situation_id: string;
  saved_at: string;
}

// ─── Coach ───────────────────────────────────────────────────────────────────

export interface CoachConversationRow {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface CoachMessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  scripture_refs: string[] | null;
  created_at: string;
}

export interface CoachUsageRow {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
}

// ─── Prayer ──────────────────────────────────────────────────────────────────

export interface PrayerGroupRow {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_by: string;
  is_private: boolean;
  created_at: string;
}

export interface PrayerGroupMemberRow {
  group_id: string;
  user_id: string;
  role: 'member' | 'leader';
  joined_at: string;
}

export interface PrayerRequestRow {
  id: string;
  group_id: string;
  user_id: string;
  body: string;
  is_anonymous: boolean;
  is_praise: boolean;
  is_answered: boolean;
  answered_note: string | null;
  answered_at: string | null;
  reported_at: string | null;
  removed_at: string | null;
  created_at: string;
}

export interface PrayerInteractionRow {
  id: string;
  request_id: string;
  user_id: string;
  created_at: string;
}

// ─── Discussion ──────────────────────────────────────────────────────────────

export interface DiscussionThreadRow {
  id: string;
  category: 'floor_life' | 'integrity_questions' | 'family_schedule' | 'leading_others' | 'testimonies' | 'prayer_for_industry';
  title: string;
  body: string;
  user_id: string;
  is_anonymous: boolean;
  reply_count: number;
  reported_at: string | null;
  removed_at: string | null;
  created_at: string;
}

export interface DiscussionReplyRow {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  is_anonymous: boolean;
  reported_at: string | null;
  removed_at: string | null;
  created_at: string;
}

// ─── Reading Plans ───────────────────────────────────────────────────────────

export interface ReadingPlanRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  day_count: number;
  cover_image_url: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface ReadingPlanDayRow {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  body: string;
  application: string | null;
}

export interface ReadingPlanProgressRow {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  days_completed: number[];
}

// ─── Memory Verses ───────────────────────────────────────────────────────────

export interface MemoryVerseRow {
  id: string;
  user_id: string;
  reference: string;
  verse_text: string;
  translation: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  created_at: string;
}

// ─── System ──────────────────────────────────────────────────────────────────

export interface ServiceLogRow {
  id: string;
  user_id: string;
  description: string;
  logged_at: string;
}

export interface NotificationTokenRow {
  id: string;
  user_id: string;
  expo_push_token: string | null;
  platform: 'ios' | 'android' | null;
  active: boolean;
  updated_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  content_type: 'prayer_request' | 'discussion_thread' | 'discussion_reply';
  content_id: string;
  reason: string;
  created_at: string;
}

// ─── Helper: minimal Insert/Update types ──────────────────────────────────────

type MinimalInsert<T> = Partial<T>;
type MinimalUpdate = Record<string, unknown>;

// ─── Supabase Database type ──────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      devotionals: {
        Row: DevotionalRow;
        Insert: MinimalInsert<DevotionalRow>;
        Update: MinimalUpdate;
      };
      devotional_completions: {
        Row: DevotionalCompletionRow;
        Insert: MinimalInsert<DevotionalCompletionRow>;
        Update: MinimalUpdate;
      };
      saturday_ready: {
        Row: SaturdayReadyRow;
        Insert: MinimalInsert<SaturdayReadyRow>;
        Update: MinimalUpdate;
      };
      saturday_ready_responses: {
        Row: SaturdayReadyResponseRow;
        Insert: MinimalInsert<SaturdayReadyResponseRow>;
        Update: MinimalUpdate;
      };
      deal_debriefs: {
        Row: DealDebriefRow;
        Insert: MinimalInsert<DealDebriefRow>;
        Update: MinimalUpdate;
      };
      confession_repair: {
        Row: ConfessionRepairRow;
        Insert: MinimalInsert<ConfessionRepairRow>;
        Update: MinimalUpdate;
      };
      situations: {
        Row: SituationRow;
        Insert: MinimalInsert<SituationRow>;
        Update: MinimalUpdate;
      };
      situation_saves: {
        Row: SituationSaveRow;
        Insert: MinimalInsert<SituationSaveRow>;
        Update: MinimalUpdate;
      };
      coach_conversations: {
        Row: CoachConversationRow;
        Insert: MinimalInsert<CoachConversationRow>;
        Update: MinimalUpdate;
      };
      coach_messages: {
        Row: CoachMessageRow;
        Insert: MinimalInsert<CoachMessageRow>;
        Update: MinimalUpdate;
      };
      coach_usage: {
        Row: CoachUsageRow;
        Insert: MinimalInsert<CoachUsageRow>;
        Update: MinimalUpdate;
      };
      prayer_groups: {
        Row: PrayerGroupRow;
        Insert: MinimalInsert<PrayerGroupRow>;
        Update: MinimalUpdate;
      };
      prayer_group_members: {
        Row: PrayerGroupMemberRow;
        Insert: MinimalInsert<PrayerGroupMemberRow>;
        Update: MinimalUpdate;
      };
      prayer_requests: {
        Row: PrayerRequestRow;
        Insert: MinimalInsert<PrayerRequestRow>;
        Update: MinimalUpdate;
      };
      prayer_interactions: {
        Row: PrayerInteractionRow;
        Insert: MinimalInsert<PrayerInteractionRow>;
        Update: MinimalUpdate;
      };
      discussion_threads: {
        Row: DiscussionThreadRow;
        Insert: MinimalInsert<DiscussionThreadRow>;
        Update: MinimalUpdate;
      };
      discussion_replies: {
        Row: DiscussionReplyRow;
        Insert: MinimalInsert<DiscussionReplyRow>;
        Update: MinimalUpdate;
      };
      reading_plans: {
        Row: ReadingPlanRow;
        Insert: MinimalInsert<ReadingPlanRow>;
        Update: MinimalUpdate;
      };
      reading_plan_days: {
        Row: ReadingPlanDayRow;
        Insert: MinimalInsert<ReadingPlanDayRow>;
        Update: MinimalUpdate;
      };
      reading_plan_progress: {
        Row: ReadingPlanProgressRow;
        Insert: MinimalInsert<ReadingPlanProgressRow>;
        Update: MinimalUpdate;
      };
      memory_verses: {
        Row: MemoryVerseRow;
        Insert: MinimalInsert<MemoryVerseRow>;
        Update: MinimalUpdate;
      };
      service_log: {
        Row: ServiceLogRow;
        Insert: MinimalInsert<ServiceLogRow>;
        Update: MinimalUpdate;
      };
      notification_tokens: {
        Row: NotificationTokenRow;
        Insert: MinimalInsert<NotificationTokenRow>;
        Update: MinimalUpdate;
      };
      reports: {
        Row: ReportRow;
        Insert: MinimalInsert<ReportRow>;
        Update: MinimalUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableName = keyof Database['public']['Tables'];
