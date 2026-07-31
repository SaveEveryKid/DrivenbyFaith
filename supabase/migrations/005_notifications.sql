-- =============================================================================
-- Migration 005: Add notification preference columns to profiles
-- Also updates the notification_tokens table with any missing fields
-- =============================================================================

-- Add notification preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS devotional_reminder_enabled BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS devotional_reminder_time TEXT DEFAULT '12:00'; -- UTC, 7am CT

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS saturday_ready_reminder_enabled BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS prayer_reminder_enabled BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS memory_reminder_enabled BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS memory_reminder_time TEXT DEFAULT '14:00'; -- UTC, 9am CT
