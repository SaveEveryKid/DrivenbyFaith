-- =============================================================================
-- Migration 003: rotating devotional/Saturday Ready content
--
-- devotionals and saturday_ready were keyed by a fixed calendar date, so once
-- the seed data ran out past its last publish_date/release_date, the app had
-- nothing to show — a hard wall for anyone on an annual subscription. This
-- migration adds two functions that cycle through the existing content by
-- day/week offset instead of requiring an exact date match, so the app never
-- runs out regardless of library size.
--
-- That rotation means the same devotional_id / saturday_ready_id will recur
-- for a user over a long enough time horizon, so the two "completion" tables
-- are re-keyed by calendar date instead of by content id — otherwise a
-- returning occurrence would look pre-completed from the first pass through
-- the cycle, and long-term completion counts would stop growing once a user
-- had done one full lap of the library.
-- =============================================================================

-- ── devotional_completions: key by (user, day) instead of (user, devotional) ─

ALTER TABLE devotional_completions
  DROP CONSTRAINT devotional_completions_user_id_devotional_id_key;

ALTER TABLE devotional_completions
  ADD COLUMN completed_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE devotional_completions
  ADD CONSTRAINT devotional_completions_user_id_completed_date_key UNIQUE (user_id, completed_date);

CREATE INDEX idx_devotional_completions_completed_date ON devotional_completions(completed_date);

-- ── saturday_ready_responses: key by (user, week) instead of (user, entry) ──

ALTER TABLE saturday_ready_responses
  DROP CONSTRAINT saturday_ready_responses_user_id_saturday_ready_id_key;

ALTER TABLE saturday_ready_responses
  ADD COLUMN response_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE saturday_ready_responses
  ADD CONSTRAINT saturday_ready_responses_user_id_response_date_key UNIQUE (user_id, response_date);

CREATE INDEX idx_srr_response_date ON saturday_ready_responses(response_date);

-- ── get_todays_devotional(): rotate through devotionals by day offset ───────

CREATE OR REPLACE FUNCTION get_todays_devotional()
RETURNS devotionals AS $$
DECLARE
  total_count INTEGER;
  earliest_date DATE;
  day_offset INTEGER;
  result devotionals;
BEGIN
  SELECT count(*), min(publish_date) INTO total_count, earliest_date FROM devotionals;

  IF total_count IS NULL OR total_count = 0 THEN
    RETURN NULL;
  END IF;

  day_offset := (CURRENT_DATE - earliest_date) % total_count;
  IF day_offset < 0 THEN
    day_offset := day_offset + total_count;
  END IF;

  SELECT * INTO result FROM devotionals ORDER BY publish_date ASC, id ASC OFFSET day_offset LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE ALL ON FUNCTION get_todays_devotional() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_todays_devotional() TO authenticated;

-- ── get_current_saturday_ready(): rotate through entries by week offset ─────

CREATE OR REPLACE FUNCTION get_current_saturday_ready()
RETURNS saturday_ready AS $$
DECLARE
  total_count INTEGER;
  earliest_date DATE;
  week_offset INTEGER;
  result saturday_ready;
BEGIN
  SELECT count(*), min(release_date) INTO total_count, earliest_date FROM saturday_ready;

  IF total_count IS NULL OR total_count = 0 THEN
    RETURN NULL;
  END IF;

  week_offset := ((CURRENT_DATE - earliest_date) / 7) % total_count;
  IF week_offset < 0 THEN
    week_offset := week_offset + total_count;
  END IF;

  SELECT * INTO result FROM saturday_ready ORDER BY release_date ASC, id ASC OFFSET week_offset LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE ALL ON FUNCTION get_current_saturday_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_saturday_ready() TO authenticated;
