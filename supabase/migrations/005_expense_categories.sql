-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- FK on expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL;

-- Seed default categories
INSERT INTO expense_categories (name, sort_order) VALUES
  ('급여/인건비', 1),
  ('광고비', 2),
  ('사무용품', 3),
  ('교통/출장', 4),
  ('식비/접대', 5),
  ('기타', 6)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON expense_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
