-- =============================================================================
-- Migration 003: Add line_wont_cross_updated_at to profiles
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS line_wont_cross_updated_at TIMESTAMPTZ;

-- Optionally backfill for existing profiles that already have a line set
UPDATE profiles
  SET line_wont_cross_updated_at = updated_at
  WHERE line_wont_cross IS NOT NULL AND line_wont_cross_updated_at IS NULL;
