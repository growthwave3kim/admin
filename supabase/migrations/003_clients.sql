-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text GENERATED ALWAYS AS (lower(trim(name))) STORED,
  contact_name text,
  contact_phone text,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add client_id FK to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

-- Migrate: insert distinct company names as clients
INSERT INTO clients (name)
SELECT DISTINCT company_name FROM tasks
ON CONFLICT DO NOTHING;

-- Link tasks to their new client records
UPDATE tasks t SET client_id = c.id
FROM clients c WHERE c.name = t.company_name;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_normalized_name ON clients(normalized_name);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- updated_at trigger
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
