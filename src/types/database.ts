// =============================================================================
// Database types — exact match to migration schema
// =============================================================================

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
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
}

// ─── Devotionals ─────────────────────────────────────────────────────────────

export interface Devotional {
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

export interface DevotionalCompletion {
  id: string;
  user_id: string;
  devotional_id: string;
  completed_at: string;
  reflection_response: string | null;
  challenge_accepted: boolean;
  challenge_completed: boolean;
  client_updated_at: string | null;
}

// ─── Saturday Ready ──────────────────────────────────────────────────────────

export interface SaturdayReady {
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

export interface SaturdayReadyResponse {
  id: string;
  user_id: string;
  saturday_ready_id: string;
  commitments_selected: string[] | null;
  notes: string | null;
  completed_at: string;
}

// ─── Deal Debriefs ───────────────────────────────────────────────────────────

export interface DealDebrief {
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

// ─── Situations ──────────────────────────────────────────────────────────────

export interface Situation {
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
}

export interface SituationSave {
  id: string;
  user_id: string;
  situation_id: string;
  saved_at: string;
}

// ─── Coach AI ────────────────────────────────────────────────────────────────

export interface CoachConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  scripture_refs: string[] | null;
  created_at: string;
}

export interface CoachUsage {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
}

// ─── Prayer ──────────────────────────────────────────────────────────────────

export interface PrayerGroup {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  created_by: string;
  is_private: boolean;
  created_at: string;
}

export interface PrayerGroupMember {
  group_id: string;
  user_id: string;
  role: 'member' | 'leader';
  joined_at: string;
}

export interface PrayerRequest {
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

export interface PrayerInteraction {
  id: string;
  request_id: string;
  user_id: string;
  created_at: string;
}

// ─── Discussion ──────────────────────────────────────────────────────────────

export interface DiscussionThread {
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

export interface DiscussionReply {
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

export interface ReadingPlan {
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

export interface ReadingPlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  body: string;
  application: string | null;
}

export interface ReadingPlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  days_completed: number[];
}

// ─── Memory Verses ───────────────────────────────────────────────────────────

export interface MemoryVerse {
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

export interface ServiceLog {
  id: string;
  user_id: string;
  description: string;
  logged_at: string;
}

export interface NotificationToken {
  id: string;
  user_id: string;
  expo_push_token: string | null;
  platform: 'ios' | 'android' | null;
  active: boolean;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  content_type: 'prayer_request' | 'discussion_thread' | 'discussion_reply';
  content_id: string;
  reason: string;
  created_at: string;
}

// ─── Row type helper ─────────────────────────────────────────────────────────

export interface Database {
  profiles: Profile;
  devotionals: Devotional;
  devotional_completions: DevotionalCompletion;
  saturday_ready: SaturdayReady;
  saturday_ready_responses: SaturdayReadyResponse;
  deal_debriefs: DealDebrief;
  situations: Situation;
  situation_saves: SituationSave;
  coach_conversations: CoachConversation;
  coach_messages: CoachMessage;
  coach_usage: CoachUsage;
  prayer_groups: PrayerGroup;
  prayer_group_members: PrayerGroupMember;
  prayer_requests: PrayerRequest;
  prayer_interactions: PrayerInteraction;
  discussion_threads: DiscussionThread;
  discussion_replies: DiscussionReply;
  reading_plans: ReadingPlan;
  reading_plan_days: ReadingPlanDay;
  reading_plan_progress: ReadingPlanProgress;
  memory_verses: MemoryVerse;
  service_log: ServiceLog;
  notification_tokens: NotificationToken;
  reports: Report;
}

export type TableName = keyof Database;
