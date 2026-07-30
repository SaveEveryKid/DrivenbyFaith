-- =============================================================================
-- Migration 004: Create confession_repair table
-- =============================================================================

CREATE TABLE confession_repair (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  confession TEXT NOT NULL DEFAULT '',
  repair_step TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_confession_repair_user ON confession_repair(user_id);
CREATE INDEX idx_confession_repair_date ON confession_repair(entry_date);

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE confession_repair ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_select_own ON confession_repair
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cr_insert_own ON confession_repair
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cr_update_own ON confession_repair
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cr_delete_own ON confession_repair
  FOR DELETE USING (auth.uid() = user_id);
