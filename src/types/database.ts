// =============================================================================
// Database types — exact match to migration schema
// =============================================================================

// ─── Profiles ────────────────────────────────────────────────────────────────

export type Profile = {
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
  created_at: string;
  updated_at: string;
};

// ─── Devotionals ─────────────────────────────────────────────────────────────

export type Devotional = {
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
};

export type DevotionalCompletion = {
  id: string;
  user_id: string;
  devotional_id: string;
  completed_at: string;
  completed_date: string;
  reflection_response: string | null;
  challenge_accepted: boolean;
  challenge_completed: boolean;
  client_updated_at: string | null;
};

// ─── Saturday Ready ──────────────────────────────────────────────────────────

export type SaturdayReady = {
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
};

export type SaturdayReadyResponse = {
  id: string;
  user_id: string;
  saturday_ready_id: string;
  commitments_selected: string[] | null;
  notes: string | null;
  completed_at: string;
  response_date: string;
};

// ─── Deal Debriefs ───────────────────────────────────────────────────────────

export type DealDebrief = {
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
};

// ─── Situations ──────────────────────────────────────────────────────────────

export type Situation = {
  id: string;
  slug: string;
  category: 'customer' | 'management' | 'coworker' | 'self' | 'family' | 'money' | 'ethics';
  title: string;
  situation_body: string;
  biblical_principle: string;
  scripture_refs: string[];
  practical_response: string;
  prayer: string;
  reflection_question: string;
  is_premium: boolean;
  search_vector: unknown;
  created_at: string;
};

export type SituationSave = {
  id: string;
  user_id: string;
  situation_id: string;
  saved_at: string;
};

// ─── Coach AI ────────────────────────────────────────────────────────────────

export type CoachConversation = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
};

export type CoachMessage = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  scripture_refs: string[] | null;
  created_at: string;
};

export type CoachUsage = {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
};

// ─── Prayer ──────────────────────────────────────────────────────────────────

export type PrayerGroup = {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_by: string;
  is_private: boolean;
  created_at: string;
};

export type PrayerGroupMember = {
  group_id: string;
  user_id: string;
  role: 'member' | 'leader';
  joined_at: string;
};

export type PrayerRequest = {
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
};

export type PrayerInteraction = {
  id: string;
  request_id: string;
  user_id: string;
  created_at: string;
};

// ─── Discussion ──────────────────────────────────────────────────────────────

export type DiscussionThread = {
  id: string;
  category:
    | 'floor_life'
    | 'integrity_questions'
    | 'family_schedule'
    | 'leading_others'
    | 'testimonies'
    | 'prayer_for_industry';
  title: string;
  body: string;
  user_id: string;
  is_anonymous: boolean;
  reply_count: number;
  reported_at: string | null;
  removed_at: string | null;
  created_at: string;
};

export type DiscussionReply = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  is_anonymous: boolean;
  reported_at: string | null;
  removed_at: string | null;
  created_at: string;
};

// ─── Reading Plans ───────────────────────────────────────────────────────────

export type ReadingPlan = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  day_count: number;
  cover_image_url: string | null;
  is_premium: boolean;
  created_at: string;
};

export type ReadingPlanDay = {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  body: string;
  application: string | null;
};

export type ReadingPlanProgress = {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  days_completed: number[];
};

// ─── Memory Verses ───────────────────────────────────────────────────────────

export type MemoryVerse = {
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
};

// ─── System ──────────────────────────────────────────────────────────────────

export type ServiceLog = {
  id: string;
  user_id: string;
  description: string;
  logged_at: string;
};

export type NotificationToken = {
  id: string;
  user_id: string;
  expo_push_token: string | null;
  platform: 'ios' | 'android' | null;
  active: boolean;
  updated_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  content_type: 'prayer_request' | 'discussion_thread' | 'discussion_reply';
  content_id: string;
  reason: string;
  created_at: string;
};

// ─── Anonymity-safe views (user_id hidden when is_anonymous = true) ──────────

export type PrayerRequestSafe = {
  id: string;
  group_id: string;
  user_id: string | null;
  body: string;
  is_anonymous: boolean;
  is_praise: boolean;
  is_answered: boolean;
  answered_note: string | null;
  answered_at: string | null;
  created_at: string;
};

export type DiscussionThreadSafe = {
  id: string;
  category: DiscussionThread['category'];
  title: string;
  body: string;
  user_id: string | null;
  is_anonymous: boolean;
  reply_count: number;
  created_at: string;
};

export type DiscussionReplySafe = {
  id: string;
  thread_id: string;
  user_id: string | null;
  body: string;
  is_anonymous: boolean;
  created_at: string;
};

// ─── Supabase client schema shape ─────────────────────────────────────────────
// Mirrors supabase-js's generated Database type: public.Tables.<name>.{Row,Insert,Update}

type TableOf<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ViewOf<Row> = {
  Row: Row;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableOf<Profile>;
      devotionals: TableOf<Devotional>;
      devotional_completions: TableOf<DevotionalCompletion>;
      saturday_ready: TableOf<SaturdayReady>;
      saturday_ready_responses: TableOf<SaturdayReadyResponse>;
      deal_debriefs: TableOf<DealDebrief>;
      situations: TableOf<Situation>;
      situation_saves: TableOf<SituationSave>;
      coach_conversations: TableOf<CoachConversation>;
      coach_messages: TableOf<CoachMessage>;
      coach_usage: TableOf<CoachUsage>;
      prayer_groups: TableOf<PrayerGroup>;
      prayer_group_members: TableOf<PrayerGroupMember>;
      prayer_requests: TableOf<PrayerRequest>;
      prayer_interactions: TableOf<PrayerInteraction>;
      discussion_threads: TableOf<DiscussionThread>;
      discussion_replies: TableOf<DiscussionReply>;
      reading_plans: TableOf<ReadingPlan>;
      reading_plan_days: TableOf<ReadingPlanDay>;
      reading_plan_progress: TableOf<ReadingPlanProgress>;
      memory_verses: TableOf<MemoryVerse>;
      service_log: TableOf<ServiceLog>;
      notification_tokens: TableOf<NotificationToken>;
      reports: TableOf<Report>;
    };
    Views: {
      prayer_requests_safe: ViewOf<PrayerRequestSafe>;
      discussion_threads_safe: ViewOf<DiscussionThreadSafe>;
      discussion_replies_safe: ViewOf<DiscussionReplySafe>;
    };
    Functions: {
      join_prayer_group_by_code: {
        Args: { p_join_code: string };
        Returns: PrayerGroup;
      };
      get_todays_devotional: {
        Args: Record<string, never>;
        Returns: Devotional;
      };
      get_current_saturday_ready: {
        Args: Record<string, never>;
        Returns: SaturdayReady;
      };
    };
    Enums: Record<string, never>;
  };
};

export type TableName = keyof Database['public']['Tables'];
