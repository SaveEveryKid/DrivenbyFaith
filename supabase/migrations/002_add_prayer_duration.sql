-- =============================================================================
-- Migration 002: Add prayer_duration_seconds to devotional_completions
-- =============================================================================

ALTER TABLE devotional_completions
  ADD COLUMN IF NOT EXISTS prayer_duration_seconds INTEGER;
