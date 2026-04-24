import { readCurrentMember } from '@/features/auth/useCurrentMember'
import type { Json } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import type { AuditAction, AuditTable } from './types'

type AuditInput = {
  tableName: AuditTable
  recordId: string
  action: AuditAction
  changedFields?: Record<string, { old: unknown; new: unknown }>
  snapshot?: unknown
  note?: string
}

export const logAudit = async (input: AuditInput): Promise<void> => {
  const member = readCurrentMember()
  if (!member) return

  await supabase.from('audit_logs').insert({
    actor_member_id: member.id,
    actor_name: member.name,
    table_name: input.tableName,
    record_id: input.recordId,
    action: input.action,
    changed_fields: (input.changedFields ?? null) as Json | null,
    snapshot: (input.snapshot ?? null) as Json | null,
    note: input.note ?? null,
  })
}
