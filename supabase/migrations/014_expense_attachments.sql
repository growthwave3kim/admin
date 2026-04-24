CREATE TABLE expense_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_by_member_id uuid REFERENCES members(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_expense_attachments_expense ON expense_attachments(expense_id);

ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can select expense_attachments"
  ON expense_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert expense_attachments"
  ON expense_attachments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can delete expense_attachments"
  ON expense_attachments FOR DELETE TO authenticated USING (true);
