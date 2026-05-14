import { supabase } from '@/lib/supabase'
import type { MarketingType } from './types'

export const fetchMarketingTypes = async () => {
  const { data, error } = await supabase.from('marketing_types').select('*').order('sort_order')
  if (error) throw error
  return data as MarketingType[]
}

export const createMarketingType = async (name: string, sort_order: number) => {
  const { data, error } = await supabase.from('marketing_types').insert({ name, sort_order }).select().single()
  if (error) throw error
  return data
}

export const updateMarketingType = async (id: string, updates: { name?: string; sort_order?: number }) => {
  const { data, error } = await supabase.from('marketing_types').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteMarketingType = async (id: string) => {
  const { error } = await supabase.from('marketing_types').delete().eq('id', id)
  if (error) throw error
}

export const reorderMarketingTypes = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase
    .from('marketing_types')
    .upsert(items as { id: string; name: string; sort_order: number }[])
  if (error) throw error
}
