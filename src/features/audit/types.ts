export type AuditAction = 'insert' | 'update' | 'delete'
export type AuditTable = 'tasks' | 'expenses' | 'clients' | 'expense_attachments'

export type AuditLog = {
  id: string
  actor_member_id: string | null
  actor_name: string | null
  table_name: string
  record_id: string
  action: AuditAction
  changed_fields: Record<string, { old: unknown; new: unknown }> | null
  snapshot: unknown | null
  note: string | null
  created_at: string
}
