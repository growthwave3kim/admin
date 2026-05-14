import { supabase } from '@/lib/supabase'
import type { AuditLog } from './types'

export const fetchAuditLogsByRecord = async (tableName: string, recordId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as AuditLog[]
}

export const fetchAuditLogs = async ({
  tableName,
  actorMemberId,
  action,
  dateFrom,
  dateTo,
  limit = 100,
}: {
  tableName?: string
  actorMemberId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) => {
  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)

  if (tableName && tableName !== 'all') query = query.eq('table_name', tableName)
  if (actorMemberId && actorMemberId !== 'all') query = query.eq('actor_member_id', actorMemberId)
  if (action && action !== 'all') query = query.eq('action', action)
  if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`)
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`)

  const { data, error } = await query
  if (error) throw error
  return data as AuditLog[]
}
