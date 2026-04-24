-- Migrate expenses.spender (text enum) to spender_member_id (FK to members)
ALTER TABLE expenses ADD COLUMN spender_member_id uuid REFERENCES members(id);

UPDATE expenses e
   SET spender_member_id = m.id
  FROM members m
 WHERE e.spender = m.name;

-- Backfill any rows that didn't match (shouldn't happen, but safety)
-- Leave as NULL if no match found

ALTER TABLE expenses DROP COLUMN spender;

CREATE INDEX IF NOT EXISTS idx_expenses_spender_member_id ON expenses(spender_member_id);
