-- 거래처/고객DB 구분 컬럼
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_contact boolean NOT NULL DEFAULT false;

-- tasks 없는 clients = 고객 DB
UPDATE clients SET is_contact = true
WHERE deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.client_id = clients.id AND tasks.deleted_at IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_clients_is_contact ON clients(is_contact);
