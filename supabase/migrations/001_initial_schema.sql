-- =============================================================================
-- Migration 001: Initial schema — all tables, triggers, and RLS policies
-- =============================================================================

-- ── Helper: updated_at trigger function ────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLES
-- =============================================================================

-- ── profiles ───────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  dealership TEXT,
  brand TEXT,
  role TEXT,
  years_in_business SMALLINT,
  faith_context TEXT CHECK (faith_context IN ('new_to_faith', 'coming_back', 'walking_steady', 'leading_others')),
  burdens JSONB,                         -- array of strings
  timezone TEXT DEFAULT 'America/Chicago',
  onboarding_complete BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  notification_preferences JSONB,
  translation TEXT DEFAULT 'ESV',
  line_wont_cross TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);

-- ── devotionals ────────────────────────────────────────────────────────────

CREATE TABLE devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  scripture_reference TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  translation TEXT DEFAULT 'ESV',
  workplace_application TEXT NOT NULL,
  reflection_prompt TEXT NOT NULL,
  prayer TEXT NOT NULL,
  challenge TEXT NOT NULL,
  audio_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_devotionals_publish_date ON devotionals(publish_date);

-- ── devotional_completions ─────────────────────────────────────────────────

CREATE TABLE devotional_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  devotional_id UUID NOT NULL REFERENCES devotionals(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  reflection_response TEXT,
  challenge_accepted BOOLEAN DEFAULT false,
  challenge_completed BOOLEAN DEFAULT false,
  client_updated_at TIMESTAMPTZ,
  UNIQUE(user_id, devotional_id)
);

CREATE INDEX idx_devotional_completions_user ON devotional_completions(user_id);
CREATE INDEX idx_devotional_completions_devotional ON devotional_completions(devotional_id);

-- ── saturday_ready ─────────────────────────────────────────────────────────

CREATE TABLE saturday_ready (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_date DATE UNIQUE NOT NULL,
  theme TEXT NOT NULL,
  scripture_reference TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  preparation_body TEXT NOT NULL,
  three_commitments JSONB NOT NULL,
  prayer TEXT NOT NULL,
  audio_url TEXT,
  is_premium BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saturday_ready_release_date ON saturday_ready(release_date);

-- ── saturday_ready_responses ───────────────────────────────────────────────

CREATE TABLE saturday_ready_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  saturday_ready_id UUID NOT NULL REFERENCES saturday_ready(id) ON DELETE CASCADE,
  commitments_selected JSONB,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, saturday_ready_id)
);

CREATE INDEX idx_srr_user ON saturday_ready_responses(user_id);
CREATE INDEX idx_srr_sr ON saturday_ready_responses(saturday_ready_id);

-- ── deal_debriefs ──────────────────────────────────────────────────────────

CREATE TABLE deal_debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  debrief_date DATE NOT NULL,
  units_sold SMALLINT,
  ups_taken SMALLINT,
  went_well TEXT,
  went_wrong TEXT,
  where_i_saw_god TEXT,
  where_i_fell_short TEXT,
  who_i_served TEXT,
  tomorrow_intention TEXT,
  gratitude TEXT,
  mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  client_updated_at TIMESTAMPTZ,
  UNIQUE(user_id, debrief_date)
);

CREATE INDEX idx_deal_debriefs_user ON deal_debriefs(user_id);
CREATE INDEX idx_deal_debriefs_date ON deal_debriefs(debrief_date);

-- ── situations ─────────────────────────────────────────────────────────────

CREATE TABLE situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('customer', 'management', 'coworker', 'self', 'family', 'money', 'ethics')),
  title TEXT NOT NULL,
  situation_body TEXT NOT NULL,
  biblical_principle TEXT NOT NULL,
  scripture_refs JSONB NOT NULL,
  practical_response TEXT NOT NULL,
  prayer TEXT NOT NULL,
  reflection_question TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(situation_body, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_situations_category ON situations(category);
CREATE INDEX idx_situations_search ON situations USING GIN(search_vector);

-- ── situation_saves ────────────────────────────────────────────────────────

CREATE TABLE situation_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  situation_id UUID NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, situation_id)
);

CREATE INDEX idx_situation_saves_user ON situation_saves(user_id);
CREATE INDEX idx_situation_saves_situation ON situation_saves(situation_id);

-- ── coach_conversations ────────────────────────────────────────────────────

CREATE TABLE coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coach_conversations_user ON coach_conversations(user_id);

-- ── coach_messages ─────────────────────────────────────────────────────────

CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  scripture_refs JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coach_messages_conversation ON coach_messages(conversation_id);

-- ── coach_usage ────────────────────────────────────────────────────────────

CREATE TABLE coach_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INTEGER DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_coach_usage_user ON coach_usage(user_id);
CREATE INDEX idx_coach_usage_date ON coach_usage(usage_date);

-- ── prayer_groups ──────────────────────────────────────────────────────────

CREATE TABLE prayer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prayer_groups_created_by ON prayer_groups(created_by);

-- ── prayer_group_members ───────────────────────────────────────────────────

CREATE TABLE prayer_group_members (
  group_id UUID NOT NULL REFERENCES prayer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_pgm_user ON prayer_group_members(user_id);
CREATE INDEX idx_pgm_group ON prayer_group_members(group_id);

-- ── prayer_requests ────────────────────────────────────────────────────────

CREATE TABLE prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES prayer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_praise BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  answered_note TEXT,
  answered_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prayer_requests_group ON prayer_requests(group_id);
CREATE INDEX idx_prayer_requests_user ON prayer_requests(user_id);

-- ── prayer_interactions ────────────────────────────────────────────────────

CREATE TABLE prayer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, user_id)
);

CREATE INDEX idx_prayer_interactions_request ON prayer_interactions(request_id);
CREATE INDEX idx_prayer_interactions_user ON prayer_interactions(user_id);

-- ── discussion_threads ─────────────────────────────────────────────────────

CREATE TABLE discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('floor_life', 'integrity_questions', 'family_schedule', 'leading_others', 'testimonies', 'prayer_for_industry')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,
  reply_count INTEGER DEFAULT 0,
  reported_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_discussion_threads_user ON discussion_threads(user_id);
CREATE INDEX idx_discussion_threads_category ON discussion_threads(category);

-- ── discussion_replies ─────────────────────────────────────────────────────

CREATE TABLE discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  reported_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_discussion_replies_thread ON discussion_replies(thread_id);
CREATE INDEX idx_discussion_replies_user ON discussion_replies(user_id);

-- ── reading_plans ──────────────────────────────────────────────────────────

CREATE TABLE reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  day_count INTEGER NOT NULL,
  cover_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── reading_plan_days ──────────────────────────────────────────────────────

CREATE TABLE reading_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  scripture_reference TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  body TEXT NOT NULL,
  application TEXT,
  UNIQUE(plan_id, day_number)
);

CREATE INDEX idx_reading_plan_days_plan ON reading_plan_days(plan_id);

-- ── reading_plan_progress ──────────────────────────────────────────────────

CREATE TABLE reading_plan_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  days_completed JSONB DEFAULT '[]',
  UNIQUE(user_id, plan_id)
);

CREATE INDEX idx_reading_plan_progress_user ON reading_plan_progress(user_id);
CREATE INDEX idx_reading_plan_progress_plan ON reading_plan_progress(plan_id);

-- ── memory_verses ──────────────────────────────────────────────────────────

CREATE TABLE memory_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  translation TEXT DEFAULT 'ESV',
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_memory_verses_user ON memory_verses(user_id);
CREATE INDEX idx_memory_verses_review_date ON memory_verses(next_review_date);

-- ── service_log ────────────────────────────────────────────────────────────

CREATE TABLE service_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_log_user ON service_log(user_id);

-- ── notification_tokens ────────────────────────────────────────────────────

CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT UNIQUE,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_tokens_user ON notification_tokens(user_id);

-- ── reports ────────────────────────────────────────────────────────────────

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('prayer_request', 'discussion_thread', 'discussion_reply')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- ── Auto-create profile on auth.users INSERT ──────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ── Auto-update profiles.updated_at ────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS — ENABLE ON ALL TABLES
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saturday_ready ENABLE ROW LEVEL SECURITY;
ALTER TABLE saturday_ready_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- ── profiles ───────────────────────────────────────────────────────────────
-- SELECT: users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- UPDATE: users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: users can delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE USING (auth.uid() = id);

-- INSERT: only the trigger should insert (handle_new_user), but allow service_role
-- We allow authenticated inserts only for the user's own id to be safe,
-- but the primary path is the trigger.
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── devotionals ────────────────────────────────────────────────────────────
CREATE POLICY devotionals_select_auth ON devotionals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY devotionals_deny_insert ON devotionals
  FOR INSERT WITH CHECK (false);

CREATE POLICY devotionals_deny_update ON devotionals
  FOR UPDATE USING (false);

CREATE POLICY devotionals_deny_delete ON devotionals
  FOR DELETE USING (false);

-- ── devotional_completions ─────────────────────────────────────────────────
CREATE POLICY dc_select_own ON devotional_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY dc_insert_own ON devotional_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY dc_update_own ON devotional_completions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY dc_delete_own ON devotional_completions
  FOR DELETE USING (auth.uid() = user_id);

-- ── saturday_ready ─────────────────────────────────────────────────────────
CREATE POLICY sr_select_auth ON saturday_ready
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY sr_deny_insert ON saturday_ready
  FOR INSERT WITH CHECK (false);

CREATE POLICY sr_deny_update ON saturday_ready
  FOR UPDATE USING (false);

CREATE POLICY sr_deny_delete ON saturday_ready
  FOR DELETE USING (false);

-- ── saturday_ready_responses ───────────────────────────────────────────────
CREATE POLICY srr_select_own ON saturday_ready_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY srr_insert_own ON saturday_ready_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY srr_update_own ON saturday_ready_responses
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY srr_delete_own ON saturday_ready_responses
  FOR DELETE USING (auth.uid() = user_id);

-- ── deal_debriefs ──────────────────────────────────────────────────────────
CREATE POLICY dd_select_own ON deal_debriefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY dd_insert_own ON deal_debriefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY dd_update_own ON deal_debriefs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY dd_delete_own ON deal_debriefs
  FOR DELETE USING (auth.uid() = user_id);

-- ── situations ─────────────────────────────────────────────────────────────
CREATE POLICY situations_select_auth ON situations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY situations_deny_insert ON situations
  FOR INSERT WITH CHECK (false);

CREATE POLICY situations_deny_update ON situations
  FOR UPDATE USING (false);

CREATE POLICY situations_deny_delete ON situations
  FOR DELETE USING (false);

-- ── situation_saves ────────────────────────────────────────────────────────
CREATE POLICY ss_select_own ON situation_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ss_insert_own ON situation_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ss_update_own ON situation_saves
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ss_delete_own ON situation_saves
  FOR DELETE USING (auth.uid() = user_id);

-- ── coach_conversations ────────────────────────────────────────────────────
CREATE POLICY cc_select_own ON coach_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cc_insert_own ON coach_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cc_update_own ON coach_conversations
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cc_delete_own ON coach_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ── coach_messages ─────────────────────────────────────────────────────────
CREATE POLICY cm_select_own ON coach_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_conversations
      WHERE coach_conversations.id = coach_messages.conversation_id
        AND coach_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY cm_insert_own ON coach_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_conversations
      WHERE coach_conversations.id = coach_messages.conversation_id
        AND coach_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY cm_update_own ON coach_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM coach_conversations
      WHERE coach_conversations.id = coach_messages.conversation_id
        AND coach_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY cm_delete_own ON coach_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM coach_conversations
      WHERE coach_conversations.id = coach_messages.conversation_id
        AND coach_conversations.user_id = auth.uid()
    )
  );

-- ── coach_usage ────────────────────────────────────────────────────────────
CREATE POLICY cu_select_own ON coach_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cu_insert_own ON coach_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cu_update_own ON coach_usage
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cu_delete_own ON coach_usage
  FOR DELETE USING (auth.uid() = user_id);

-- ── prayer_groups ──────────────────────────────────────────────────────────
-- SELECT: members can see groups they belong to
CREATE POLICY pg_select_member ON prayer_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prayer_group_members
      WHERE prayer_group_members.group_id = prayer_groups.id
        AND prayer_group_members.user_id = auth.uid()
    )
    OR
    -- Also allow seeing non-private groups
    (prayer_groups.is_private = false AND auth.role() = 'authenticated')
  );

CREATE POLICY pg_insert_auth ON prayer_groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY pg_update_leader ON prayer_groups
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM prayer_group_members
      WHERE prayer_group_members.group_id = prayer_groups.id
        AND prayer_group_members.user_id = auth.uid()
        AND prayer_group_members.role = 'leader'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM prayer_group_members
      WHERE prayer_group_members.group_id = prayer_groups.id
        AND prayer_group_members.user_id = auth.uid()
        AND prayer_group_members.role = 'leader'
    )
  );

CREATE POLICY pg_delete_owner ON prayer_groups
  FOR DELETE USING (created_by = auth.uid());

-- ── prayer_group_members ───────────────────────────────────────────────────
CREATE POLICY pgm_select_own_or_member ON prayer_group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM prayer_group_members AS pgm2
      WHERE pgm2.group_id = prayer_group_members.group_id
        AND pgm2.user_id = auth.uid()
    )
  );

CREATE POLICY pgm_insert_auth ON prayer_group_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY pgm_delete_own_or_leader ON prayer_group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM prayer_group_members AS pgm2
      WHERE pgm2.group_id = prayer_group_members.group_id
        AND pgm2.user_id = auth.uid()
        AND pgm2.role = 'leader'
    )
  );

-- ── prayer_requests ────────────────────────────────────────────────────────
CREATE POLICY pr_select_group_member ON prayer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prayer_group_members
      WHERE prayer_group_members.group_id = prayer_requests.group_id
        AND prayer_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY pr_insert_own ON prayer_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY pr_update_own_or_leader ON prayer_requests
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM prayer_group_members
      WHERE prayer_group_members.group_id = prayer_requests.group_id
        AND prayer_group_members.user_id = auth.uid()
        AND prayer_group_members.role = 'leader'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM prayer_group_members
      WHERE prayer_group_members.group_id = prayer_requests.group_id
        AND prayer_group_members.user_id = auth.uid()
        AND prayer_group_members.role = 'leader'
    )
  );

-- Soft-delete: anyone who can update can set removed_at
-- (handled by the UPDATE policy above; no separate DELETE policy needed)

-- ── prayer_interactions ────────────────────────────────────────────────────
CREATE POLICY pi_select_group_member ON prayer_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prayer_requests
        JOIN prayer_group_members ON prayer_group_members.group_id = prayer_requests.group_id
      WHERE prayer_requests.id = prayer_interactions.request_id
        AND prayer_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY pi_insert_own ON prayer_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE for prayer_interactions — they are immutable

-- ── discussion_threads ─────────────────────────────────────────────────────
CREATE POLICY dt_select_visible ON discussion_threads
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND removed_at IS NULL
  );

CREATE POLICY dt_insert_auth ON discussion_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY dt_update_own ON discussion_threads
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: soft-delete is via UPDATE (set removed_at); handled by update policy

-- ── discussion_replies ─────────────────────────────────────────────────────
CREATE POLICY dr_select_visible ON discussion_replies
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND removed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM discussion_threads
      WHERE discussion_threads.id = discussion_replies.thread_id
        AND discussion_threads.removed_at IS NULL
    )
  );

CREATE POLICY dr_insert_auth ON discussion_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY dr_update_own ON discussion_replies
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── reading_plans ──────────────────────────────────────────────────────────
CREATE POLICY rp_select_auth ON reading_plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY rp_deny_insert ON reading_plans
  FOR INSERT WITH CHECK (false);

CREATE POLICY rp_deny_update ON reading_plans
  FOR UPDATE USING (false);

CREATE POLICY rp_deny_delete ON reading_plans
  FOR DELETE USING (false);

-- ── reading_plan_days ──────────────────────────────────────────────────────
CREATE POLICY rpd_select_auth ON reading_plan_days
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY rpd_deny_insert ON reading_plan_days
  FOR INSERT WITH CHECK (false);

CREATE POLICY rpd_deny_update ON reading_plan_days
  FOR UPDATE USING (false);

CREATE POLICY rpd_deny_delete ON reading_plan_days
  FOR DELETE USING (false);

-- ── reading_plan_progress ──────────────────────────────────────────────────
CREATE POLICY rpp_select_own ON reading_plan_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY rpp_insert_own ON reading_plan_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY rpp_update_own ON reading_plan_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY rpp_delete_own ON reading_plan_progress
  FOR DELETE USING (auth.uid() = user_id);

-- ── memory_verses ──────────────────────────────────────────────────────────
CREATE POLICY mv_select_own ON memory_verses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY mv_insert_own ON memory_verses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY mv_update_own ON memory_verses
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY mv_delete_own ON memory_verses
  FOR DELETE USING (auth.uid() = user_id);

-- ── service_log ────────────────────────────────────────────────────────────
CREATE POLICY sl_select_own ON service_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY sl_insert_own ON service_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY sl_update_own ON service_log
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY sl_delete_own ON service_log
  FOR DELETE USING (auth.uid() = user_id);

-- ── notification_tokens ────────────────────────────────────────────────────
CREATE POLICY nt_select_own ON notification_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY nt_insert_own ON notification_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY nt_update_own ON notification_tokens
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY nt_delete_own ON notification_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- ── reports ────────────────────────────────────────────────────────────────
CREATE POLICY rpt_select_own ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY rpt_insert_auth ON reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE/DELETE for reports — immutable once created

-- =============================================================================
-- ANONYMITY ENFORCEMENT: SECURITY DEFINER VIEWS
-- =============================================================================

-- Prayer requests view that hides user_id when is_anonymous = true
CREATE OR REPLACE VIEW prayer_requests_safe AS
SELECT
  id,
  group_id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END AS user_id,
  body,
  is_anonymous,
  is_praise,
  is_answered,
  answered_note,
  answered_at,
  created_at
FROM prayer_requests
WHERE removed_at IS NULL;

-- Discussion threads view that hides user_id when is_anonymous = true
CREATE OR REPLACE VIEW discussion_threads_safe AS
SELECT
  id,
  category,
  title,
  body,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END AS user_id,
  is_anonymous,
  reply_count,
  created_at
FROM discussion_threads
WHERE removed_at IS NULL;

-- Discussion replies view that hides user_id when is_anonymous = true
CREATE OR REPLACE VIEW discussion_replies_safe AS
SELECT
  dr.id,
  dr.thread_id,
  CASE WHEN dr.is_anonymous THEN NULL ELSE dr.user_id END AS user_id,
  dr.body,
  dr.is_anonymous,
  dr.created_at
FROM discussion_replies dr
JOIN discussion_threads dt ON dt.id = dr.thread_id
WHERE dr.removed_at IS NULL AND dt.removed_at IS NULL;
