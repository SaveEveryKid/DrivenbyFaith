-- =============================================================================
-- Migration 002: Prayer & Community helper functions
-- =============================================================================

-- ── Generate a random 6-character join code ──────────────────────────────────
-- Uses uppercase alphanumeric, excluding ambiguous chars (0, O, I, 1, L)

CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ── Get member count for a group ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_group_member_count(gid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer FROM prayer_group_members WHERE group_id = gid;
$$;

-- ── Get display name for any user (SECURITY DEFINER to bypass RLS) ───────────

CREATE OR REPLACE FUNCTION get_display_name(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT display_name FROM profiles WHERE id = uid;
$$;

-- ── Increment thread reply count atomically ──────────────────────────────────

CREATE OR REPLACE FUNCTION increment_thread_reply_count(tid UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE discussion_threads
  SET reply_count = reply_count + 1
  WHERE id = tid;
$$;

-- ── Grant execute to authenticated users ─────────────────────────────────────

GRANT EXECUTE ON FUNCTION generate_join_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_member_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_display_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_thread_reply_count(UUID) TO authenticated;
