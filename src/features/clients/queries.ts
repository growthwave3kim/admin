import { logAudit } from '@/features/audit/logAudit'
import { supabase } from '@/lib/supabase'
import type { Client, ClientFormData } from './types'

// 거래처 전체 (업무 드롭다운 등)
export const fetchClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .eq('is_contact', false)
    .order('name')
    .limit(10000)
  if (error) throw error
  return data as Client[]
}

// 고객 DB 전체 (연락처 복사, 엑셀 추출)
export const fetchContacts = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .eq('is_contact', true)
    .order('name')
    .limit(10000)
  if (error) throw error
  return data as Client[]
}

export const fetchClient = async (id: string) => {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).is('deleted_at', null).single()
  if (error) throw error
  return data as Client
}

export const fetchTrashedClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  return data as Client[]
}

export const createClient = async (formData: ClientFormData) => {
  const { data, error } = await supabase.from('clients').insert(formData).select().single()
  if (error) throw error
  void logAudit({
    tableName: 'clients',
    recordId: (data as Client).id,
    action: 'insert',
    snapshot: data,
  }).catch(() => {})
  return data as Client
}

export const updateClient = async (id: string, formData: Partial<ClientFormData>) => {
  const { data, error } = await supabase.from('clients').update(formData).eq('id', id).select().single()
  if (error) throw error
  void logAudit({
    tableName: 'clients',
    recordId: id,
    action: 'update',
    snapshot: data,
  }).catch(() => {})
  return data as Client
}

export const softDeleteClient = async (id: string) => {
  const { error } = await supabase.from('clients').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  void logAudit({ tableName: 'clients', recordId: id, action: 'delete' }).catch(() => {})
}

export const restoreClient = async (id: string) => {
  const { error } = await supabase.from('clients').update({ deleted_at: null }).eq('id', id)
  if (error) throw error
}

export const permanentDeleteClient = async (id: string) => {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  void logAudit({ tableName: 'clients', recordId: id, action: 'delete' }).catch(() => {})
}

export const importClients = async (rows: Pick<ClientFormData, 'name' | 'contact_phone' | 'email'>[]) => {
  const withFlag = rows.map((r) => ({ ...r, is_contact: true }))
  const { data, error } = await supabase.from('clients').insert(withFlag).select()
  if (error) throw error
  return data as Client[]
}

export const convertToClient = async (id: string) => {
  const { error } = await supabase.from('clients').update({ is_contact: false }).eq('id', id)
  if (error) throw error
}

const PAGE_SIZE = 100

// 거래처 목록 (거래처 관리 페이지)
export const fetchClientsPage = async ({ search = '', pageParam = 0 }: { search?: string; pageParam?: number }) => {
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_contact', false)
    .order('name')
  if (search) {
    const escaped = search.replace(/[%_\\]/g, (c) => `\\${c}`)
    query = query.ilike('name', `%${escaped}%`)
  }
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await query.range(from, to)
  if (error) throw error
  return {
    data: data as Client[],
    total: count ?? 0,
    nextPage: from + PAGE_SIZE < (count ?? 0) ? pageParam + 1 : undefined,
  }
}

const formatPhoneDigits = (digits: string): string => {
  if (digits.length === 11 && digits.startsWith('0'))
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  if (digits.length === 10) {
    if (digits.startsWith('02')) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return digits
}

// 고객 DB 목록 (고객 DB 페이지)
export const fetchContactsPage = async ({ pageParam = 0, search = '' }: { pageParam?: number; search?: string }) => {
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_contact', true)
    .order('name')
  if (search) {
    const escaped = search.replace(/[%_\\]/g, (c) => `\\${c}`)
    const digits = search.replace(/\D/g, '')
    if (digits.length >= 4) {
      const escapedDigits = digits.replace(/[%_\\]/g, (c) => `\\${c}`)
      const escapedFormatted = formatPhoneDigits(digits).replace(/[%_\\]/g, (c) => `\\${c}`)
      query = query.or(
        `name.ilike.%${escaped}%,contact_phone.ilike.%${escapedDigits}%,contact_phone.ilike.%${escapedFormatted}%`,
      )
    } else {
      query = query.ilike('name', `%${escaped}%`)
    }
  }
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await query.range(from, to)
  if (error) throw error
  return {
    data: data as Client[],
    total: count ?? 0,
    nextPage: from + PAGE_SIZE < (count ?? 0) ? pageParam + 1 : undefined,
  }
}

// 고객 DB 이름으로 중복 검사
export const fetchContactsByNames = async (names: string[]) => {
  if (names.length === 0) return []
  const CHUNK = 50
  const results: Client[] = []
  for (let i = 0; i < names.length; i += CHUNK) {
    const chunk = names.slice(i, i + CHUNK)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .eq('is_contact', true)
      .in('name', chunk)
    if (error) throw error
    results.push(...(data as Client[]))
  }
  return results
}

export const fetchContactsTotal = async () => {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('is_contact', true)
  if (error) throw error
  return count ?? 0
}
