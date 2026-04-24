CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_member_id uuid REFERENCES members(id),
  actor_name text,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changed_fields jsonb,
  snapshot jsonb,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_record  ON audit_logs(table_name, record_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor   ON audit_logs(actor_member_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 로그인 사용자 조회 허용
CREATE POLICY "authenticated read" ON audit_logs
  FOR SELECT TO authenticated USING (true);

-- 로그인 사용자 삽입 허용 (클라이언트 사이드 기록)
CREATE POLICY "authenticated insert" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
