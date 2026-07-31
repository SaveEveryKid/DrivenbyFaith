-- =============================================================================
-- Migration 002: join_prayer_group_by_code
-- RLS on prayer_groups only exposes private groups to existing members, so a
-- user entering a private group's join code has no way to SELECT it directly.
-- This SECURITY DEFINER function looks the group up by code (bypassing that
-- restriction, since the code itself is the credential) and adds the caller
-- as a member, idempotently.
-- =============================================================================

CREATE OR REPLACE FUNCTION join_prayer_group_by_code(p_join_code TEXT)
RETURNS prayer_groups AS $$
DECLARE
  target_group prayer_groups;
BEGIN
  SELECT * INTO target_group FROM prayer_groups WHERE join_code = p_join_code;

  IF target_group.id IS NULL THEN
    RAISE EXCEPTION 'No group found for that code';
  END IF;

  INSERT INTO prayer_group_members (group_id, user_id, role)
  VALUES (target_group.id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN target_group;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION join_prayer_group_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_prayer_group_by_code(TEXT) TO authenticated;
