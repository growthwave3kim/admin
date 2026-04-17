import { supabase } from '@/lib/supabase'
import type { Client, ClientFormData } from './types'

export const fetchClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data as Client[]
}

export const fetchClient = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
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
  const { data, error } = await supabase
    .from('clients')
    .insert(formData)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export const updateClient = async (
  id: string,
  formData: Partial<ClientFormData>,
) => {
  const { data, error } = await supabase
    .from('clients')
    .update(formData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export const softDeleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export const restoreClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) throw error
}

export const permanentDeleteClient = async (id: string) => {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export const importClients = async (
  rows: Pick<ClientFormData, 'name' | 'contact_phone' | 'email'>[],
) => {
  const { data, error } = await supabase.from('clients').insert(rows).select()
  if (error) throw error
  return data as Client[]
}

const CLIENTS_PAGE_SIZE = 20

export const fetchClientsPage = async ({
  search = '',
  pageParam = 0,
}: {
  search?: string
  pageParam?: number
}) => {
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('name')
  if (search) {
    const escaped = search.replace(/[%_\\]/g, (c) => `\\${c}`)
    query = query.ilike('name', `%${escaped}%`)
  }
  const from = pageParam * CLIENTS_PAGE_SIZE
  const to = from + CLIENTS_PAGE_SIZE - 1
  const { data, error, count } = await query.range(from, to)
  if (error) throw error
  return {
    data: data as Client[],
    nextPage:
      from + CLIENTS_PAGE_SIZE < (count ?? 0) ? pageParam + 1 : undefined,
  }
}
